import { Workspace } from "@rbxts/services";

export class BouncyBall {
	public Position = Vector3.zero;
	public Velocity = Vector3.zero;
	protected Acceleration = Vector3.zero;

	protected RaycastParams = new RaycastParams();

	public AirResistance = 0.025;
	public BounceFriction = 0.05;

	public Radius = 0.1;

	constructor() {
		this.RaycastParams.FilterType = Enum.RaycastFilterType.Exclude;
		this.RaycastParams.FilterDescendantsInstances = [...Workspace.QueryDescendants("BasePart[Transparency = 1]")];
	}

	protected CollisionCheck(DeltaTime: number): RaycastResult | undefined {
		const Origin = this.Position;
		const Direction = this.Velocity.mul(DeltaTime);

		if (Direction.Magnitude === 0) return;

		// return Workspace.Raycast(Origin, Direction, this.RaycastParams);
		return Workspace.Spherecast(Origin, this.Radius, Direction, this.RaycastParams);
	}

	public ApplyForce(Force: Vector3): void {
		this.Acceleration = this.Acceleration.add(Force);
	}

	public Reflect(Normal: Vector3): void {
		const VelocityDotNormal = this.Velocity.Dot(Normal);
		const Reflection = this.Velocity.sub(Normal.mul(2 * VelocityDotNormal));
		this.Velocity = Reflection;
	}

	public Update(DeltaTime: number): void {
		this.Velocity = this.Velocity.add(this.Acceleration.mul(DeltaTime));

		this.Acceleration = Vector3.zero;

		const CollisionResult = this.CollisionCheck(DeltaTime);

		if (CollisionResult) {
			// const SphereCenter = CollisionResult.Position.sub(CollisionResult.Normal.mul(this.Radius));
			// this.Position = SphereCenter;

			this.Reflect(CollisionResult.Normal);

			const FrictionFactor = math.exp(-this.BounceFriction * DeltaTime);
			this.Velocity = this.Velocity.mul(FrictionFactor);
		}

		if (this.Position.Y < Workspace.FallenPartsDestroyHeight) {
			this.Reflect(new Vector3(0, 1, 0));
		}

		this.ApplyForce(this.Velocity.mul(-this.AirResistance * DeltaTime));

		this.Position = this.Position.add(this.Velocity.mul(DeltaTime));
	}
}
