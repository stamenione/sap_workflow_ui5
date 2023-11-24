sap.ui.define(
  [
      "sap/ui/core/UIComponent",
      "sap/ui/Device",
      "ordersmanagement/workflowuimodule/model/models",
  ],
  function (UIComponent, Device, models) {
      "use strict";

      return UIComponent.extend(
      "ordersmanagement.workflowuimodule.Component",
      {
          metadata: {
          manifest: "json",
          },

          /**
          * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
          * @public
          * @override
          */
          init: function () {
          // call the base component's init function
          UIComponent.prototype.init.apply(this, arguments);

          // enable routing
          this.getRouter().initialize();

          // set the device model
          this.setModel(models.createDeviceModel(), "device");

          this.setTaskModels();

          const rejectOutcomeId = "reject";
          this.getInboxAPI().addAction(
              {
              action: rejectOutcomeId,
              label: "Reject",
              type: "reject",
              },
              function () {
              this.completeTask(false, rejectOutcomeId);
              },
              this
          );
          const approveOutcomeId = "approve";
          this.getInboxAPI().addAction(
              {
              action: approveOutcomeId,
              label: "Approve",
              type: "accept",
              },
              function () {
              this.completeTask(true, approveOutcomeId);
              },
              this
          );
          },

          setTaskModels: function () {
          // set the task model
          var startupParameters = this.getComponentData().startupParameters;
          this.setModel(startupParameters.taskModel, "task");

          // set the task context model
          var taskContextModel = new sap.ui.model.json.JSONModel(
              this._getTaskInstancesBaseURL() + "/context"
          );
          this.setModel(taskContextModel, "context");
          },

          _getTaskInstancesBaseURL: function () {
          return (
              this._getWorkflowRuntimeBaseURL() +
              "/task-instances/" +
              this.getTaskInstanceID()
          );
          },

          _getWorkflowRuntimeBaseURL: function () {
          var appId = this.getManifestEntry("/sap.app/id");
          var appPath = appId.replaceAll(".", "/");
          var appModulePath = sap.ui.require.toUrl(appPath);
          console.log(appModulePath);

          return appModulePath + "/bpmworkflowruntime/v1";
          },

          getTaskInstanceID: function () {
          return this.getModel("task").getData().InstanceID;
          },

          getInboxAPI: function () {
          var startupParameters = this.getComponentData().startupParameters;
          return startupParameters.inboxAPI;
          },

          completeTask: function (approvalStatus, outcomeId) {
          this.getModel("context").setProperty("/approved", approvalStatus);
          this._patchTaskInstance(outcomeId);
          },

          async _patchTaskInstance(outcomeId) {
            const context = this.getModel("context").getData();
            const data = {
                status: "COMPLETED",
                context: { ...context, comment: context.comment || '' },
                decision: outcomeId
            };
        
            const url = this._getTaskInstancesBaseURL();
            const csrfToken = await this._fetchToken();
        
            try {
                const response = await fetch(url, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-Token": csrfToken
                    },
                    body: JSON.stringify(data)
                });
        
                if (!response.ok) {
                    throw new Error(`Failed to patch task instance. Status: ${response.status}`);
                }
        
                this._refreshTaskList();
            } catch (error) {
                console.error("Error patching task instance:", error);
                // Handle the error as needed
            }
        },

        async _fetchToken() {
            const tokenUrl = `${this._getWorkflowRuntimeBaseURL()}/xsrf-token`;
        
            try {
                const response = await fetch(tokenUrl, {
                    method: "GET",
                    headers: {
                        "X-CSRF-Token": "Fetch"
                    }
                });
        
                if (!response.ok) {
                    throw new Error(`Failed to fetch X-CSRF-Token. Status: ${response.status}`);
                }
        
                return response.headers.get("X-CSRF-Token");
            } catch (error) {
                console.error("Error fetching X-CSRF-Token:", error);
                // Handle the error as needed
                return null;
            }
        },

          _refreshTaskList: function () {
          this.getInboxAPI().updateTask("NA", this.getTaskInstanceID());
          },
      }
      );
  }
);
