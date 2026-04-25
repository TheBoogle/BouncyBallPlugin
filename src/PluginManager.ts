import { Workspace, RunService } from "@rbxts/services";
import { BouncyBall } from "BouncyBall";

export class PluginManager {
	public readonly BouncyBall = new BouncyBall();

	public Reactiveness = 20;

	protected IsInBouncyMode = false;
	protected IsInCameraMode = false;

	protected DebugMode = false;

	protected HeartbeatSignal: RBXScriptConnection | undefined = undefined;

	protected DebugBall = new Instance("Part");

	protected PendingForces: Vector3[] = [];

	public GetCamera(): Camera {
		return Workspace.CurrentCamera as Camera;
	}

	public constructor() {
		this.DebugBall.Shape = Enum.PartType.Ball;
		this.DebugBall.Size = new Vector3(
			this.BouncyBall.Radius * 2,
			this.BouncyBall.Radius * 2,
			this.BouncyBall.Radius * 2,
		);
		this.DebugBall.Anchored = true;
		this.DebugBall.CanCollide = false;
		this.DebugBall.Archivable = true;
		this.DebugBall.Locked = true;

		this.DebugBall.Parent = Workspace;
		this.DebugBall.Name = "BouncyBallDebug";

		if (!this.DebugMode) {
			this.DebugBall.Destroy();
		}

		this.HeartbeatSignal = RunService.Heartbeat.Connect((DeltaTime: number) => {
			this.Update(DeltaTime);
		});
	}

	public ToggleBouncyMode(): void {
		this.BringBallToCamera();

		this.ToggleCameraMode();

		this.IsInBouncyMode = !this.IsInBouncyMode;
	}

	public ToggleCameraMode(): void {
		this.IsInCameraMode = !this.IsInCameraMode;
	}

	public BringBallToCamera(): void {
		if (this.IsInCameraMode) return;

		this.BouncyBall.Position = this.GetCamera().CFrame.Position;
		this.BouncyBall.Velocity = new Vector3(0, 0, 0);

		const Speed = (settings().Studio as unknown as { ["Camera Speed"]: 1 })["Camera Speed"] as number;

		this.BouncyBall.UpdateListOfParts();

		this.PendingForces.push(this.GetCamera().CFrame.LookVector.mul(Speed * 10000));
	}

	public Destroy(): void {
		this.DebugBall.Destroy();

		this.HeartbeatSignal?.Disconnect();
	}

	public Update(DeltaTime: number): void {
		if (!this.IsInBouncyMode) {
			return;
		}

		const Gravity = new Vector3(0, -Workspace.Gravity, 0);
		this.BouncyBall.ApplyForce(Gravity);

		this.PendingForces.forEach((Force: Vector3) => {
			this.BouncyBall.ApplyForce(Force);
		});

		this.PendingForces.clear();

		this.BouncyBall.Update(DeltaTime);

		this.DebugBall.Position = this.BouncyBall.Position;

		if (this.IsInCameraMode) {
			const GoingTo = this.BouncyBall.Position.mul(new Vector3(1, 0, 1))
				.add(this.BouncyBall.Velocity.mul(new Vector3(1, 0, 1)))
				.add(
					new Vector3(
						0,
						math.clamp(
							this.BouncyBall.Position.Y + this.BouncyBall.Velocity.Y * 0.5,
							-math.huge,
							this.BouncyBall.Position.Y + 50,
						),
						0,
					),
				);
			this.GetCamera().CFrame = this.GetCamera().CFrame.Lerp(
				new CFrame(this.BouncyBall.Position, GoingTo),
				math.min(DeltaTime * this.Reactiveness, 1),
			);
			this.GetCamera().Focus = new CFrame(this.BouncyBall.Position, GoingTo);
		}
	}
}
