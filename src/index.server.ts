import { PluginManager } from "PluginManager";

const Toolbar = plugin.CreateToolbar("Bouncy Ball Plugin");
const Button = Toolbar.CreateButton("Toggle Bouncy Mode", "", "");
// const CameraButton = Toolbar.CreateButton("Toggle Camera Mode", "", "");
// const BringToCameraButton = Toolbar.CreateButton("Bring Ball To Camera", "", "");

const PluginSession = new PluginManager();

plugin.Deactivation.Connect(() => {
	PluginSession.Destroy();
});

plugin.Unloading.Connect(() => {
	PluginSession.Destroy();
});

Button.Click.Connect(() => {
	PluginSession.ToggleBouncyMode();
});

// CameraButton.Click.Connect(() => {
// 	PluginSession.ToggleCameraMode();
// });

// BringToCameraButton.Click.Connect(() => {
// 	PluginSession.BringBallToCamera();
// });
