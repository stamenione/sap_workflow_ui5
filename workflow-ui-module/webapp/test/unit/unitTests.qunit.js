/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"ordersmanagement/workflow-ui-module/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
