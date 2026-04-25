import { Workspace } from "@rbxts/services";

export class BouncyBall {
	public Position = Vector3.zero;
	public Velocity = Vector3.zero;
	protected Acceleration = Vector3.zero;

	protected RaycastParams = new RaycastParams();

	public Radius = 0.1;
	public AirResistance = 0.025;
	public GroundSnapDistance = 0.05;
	public GroundFriction = 0.25;
	public Restitution = 0.9;
	private readonly Epsilon = 1e-1;

	constructor() {
		this.UpdateListOfParts();
	}

	public UpdateListOfParts(): void {
		this.RaycastParams.FilterType = Enum.RaycastFilterType.Exclude;
		this.RaycastParams.RespectCanCollide = true;

		const ListOfParts = Workspace.QueryDescendants("BasePart").filter((part) => {
			if (part.IsA("BasePart") && part.Transparency > 0.7) {
				return true;
			}

			return false;
		});

		this.RaycastParams.FilterDescendantsInstances = [...ListOfParts];
	}
	protected CollisionCheck(DeltaTime: number): RaycastResult | undefined {
		const Origin = this.Position;
		const Direction = this.Velocity.mul(DeltaTime);
		const MinCastDistance = this.Radius * 2;
		const CastDirection =
			Direction.Magnitude > 0 && Direction.Magnitude < MinCastDistance
				? Direction.Unit.mul(MinCastDistance)
				: Direction;

		if (CastDirection.Magnitude === 0) return;

		// return Workspace.Raycast(Origin, Direction, this.RaycastParams);
		return Workspace.Spherecast(Origin, this.Radius, CastDirection, this.RaycastParams);
	}

	protected GroundSnapCheck(): RaycastResult | undefined {
		const Origin = this.Position.add(new Vector3(0, this.Radius, 0));
		const Direction = new Vector3(0, -(this.Radius * 2 + this.GroundSnapDistance), 0);

		return Workspace.Raycast(Origin, Direction, this.RaycastParams);
	}

	public ApplyForce(Force: Vector3): void {
		this.Acceleration = this.Acceleration.add(Force);
	}

	public Reflect(Normal: Vector3): void {
		const NormalComponent = Normal.mul(this.Velocity.Dot(Normal));
		const TangentComponent = this.Velocity.sub(NormalComponent);
		this.Velocity = TangentComponent.add(NormalComponent.mul(-this.Restitution));
	}

	public Update(DeltaTime: number): void {
		this.Velocity = this.Velocity.add(this.Acceleration.mul(DeltaTime));

		if (this.Velocity.Magnitude < this.Epsilon) {
			this.Velocity = Vector3.zero;
		}

		this.Acceleration = Vector3.zero;

		const CollisionResult = this.CollisionCheck(DeltaTime);
		let IsGrounded = false;

		if (CollisionResult) {
			const SphereCenter = CollisionResult.Position.add(CollisionResult.Normal.mul(this.Radius));
			this.Position = SphereCenter;

			this.Reflect(CollisionResult.Normal);
			IsGrounded = CollisionResult.Normal.Y > 0.5;
		}

		if (this.Position.Y < Workspace.FallenPartsDestroyHeight) {
			this.Reflect(new Vector3(0, 1, 0));
		}

		if (!IsGrounded) {
			this.ApplyForce(this.Velocity.mul(-this.AirResistance * DeltaTime));
		}

		this.Position = this.Position.add(this.Velocity.mul(DeltaTime));

		const GroundSnapResult = this.GroundSnapCheck();
		if (GroundSnapResult) {
			this.Position = GroundSnapResult.Position.add(GroundSnapResult.Normal.mul(this.Radius));

			const NormalVelocity = this.Velocity.Dot(GroundSnapResult.Normal);
			if (NormalVelocity < 0) {
				this.Velocity = this.Velocity.sub(GroundSnapResult.Normal.mul(NormalVelocity));
			}

			IsGrounded = GroundSnapResult.Normal.Y > 0.5 || IsGrounded;
		}

		if (IsGrounded) {
			const Horizontal = new Vector3(this.Velocity.X, 0, this.Velocity.Z);
			const FrictionFactor = math.exp(-this.GroundFriction * DeltaTime);
			this.Velocity = new Vector3(Horizontal.X * FrictionFactor, this.Velocity.Y, Horizontal.Z * FrictionFactor);
		}
	}
}
