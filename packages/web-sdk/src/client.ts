import { GeoSphereSDKConfig } from "./types/index.js";
import { HTTPClient } from "./http/index.js";
import { AuthModule } from "./auth/index.js";
import { TenantModule } from "./tenant/index.js";
import { ApplicationModule } from "./application/index.js";
import { UserModule } from "./user/index.js";
import { GISModule } from "./gis/index.js";
import { MapsModule } from "./maps/index.js";
import { LayersModule } from "./layers/index.js";
import { FeaturesModule } from "./features/index.js";
import { GeofenceModule } from "./geofence/index.js";
import { LocationModule } from "./location/index.js";
import { TrackingModule } from "./tracking/index.js";
import { RoutingModule } from "./routing/index.js";
import { NavigationModule } from "./navigation/index.js";
import { SearchModule } from "./search/index.js";
import { SpatialAnalysisModule } from "./spatial-analysis/index.js";
import { OfflineModule } from "./offline/index.js";
import { RealtimeModule } from "./realtime/index.js";
import { FormsModule } from "./forms/index.js";
import { TasksModule } from "./tasks/index.js";
import { WorkflowsModule } from "./workflows/index.js";
import { MediaModule } from "./media/index.js";
import { NotificationsModule } from "./notifications/index.js";
import { ReportsModule } from "./reports/index.js";
import { AnalyticsModule } from "./analytics/index.js";
import { AssetsModule } from "./assets/index.js";
import { SchedulingModule } from "./scheduling/index.js";
import { RulesModule } from "./rules/index.js";
import { SubscriptionModule } from "./subscription/index.js";
import { LicensingModule } from "./licensing/index.js";
import { EntitlementsModule } from "./entitlements/index.js";
import { ConfigurationModule } from "./configuration/index.js";

export class GeoSphereClient {
  private http: HTTPClient;

  public readonly auth: AuthModule;
  public readonly tenants: TenantModule;
  public readonly applications: ApplicationModule;
  public readonly users: UserModule;
  public readonly gis: GISModule;
  public readonly maps: MapsModule;
  public readonly layers: LayersModule;
  public readonly features: FeaturesModule;
  public readonly geofences: GeofenceModule;
  public readonly location: LocationModule;
  public readonly tracking: TrackingModule;
  public readonly routing: RoutingModule;
  public readonly navigation: NavigationModule;
  public readonly search: SearchModule;
  public readonly spatialAnalysis: SpatialAnalysisModule;
  public readonly offline: OfflineModule;
  public readonly realtime: RealtimeModule;
  public readonly forms: FormsModule;
  public readonly tasks: TasksModule;
  public readonly workflows: WorkflowsModule;
  public readonly media: MediaModule;
  public readonly notifications: NotificationsModule;
  public readonly reports: ReportsModule;
  public readonly analytics: AnalyticsModule;
  public readonly assets: AssetsModule;
  public readonly scheduling: SchedulingModule;
  public readonly rules: RulesModule;
  public readonly subscription: SubscriptionModule;
  public readonly licensing: LicensingModule;
  public readonly entitlements: EntitlementsModule;
  public readonly configuration: ConfigurationModule;

  constructor(config: GeoSphereSDKConfig) {
    this.http = new HTTPClient(config);

    this.auth = new AuthModule(this.http);
    this.tenants = new TenantModule(this.http);
    this.applications = new ApplicationModule(this.http);
    this.users = new UserModule(this.http);
    this.gis = new GISModule(this.http);
    this.maps = new MapsModule(this.http);
    this.layers = new LayersModule(this.http);
    this.features = new FeaturesModule(this.http);
    this.geofences = new GeofenceModule(this.http);
    this.location = new LocationModule(this.http);
    this.tracking = new TrackingModule(this.http);
    this.routing = new RoutingModule(this.http);
    this.navigation = new NavigationModule(this.http);
    this.search = new SearchModule(this.http);
    this.spatialAnalysis = new SpatialAnalysisModule(this.http);
    this.offline = new OfflineModule(this.http);
    this.realtime = new RealtimeModule(this.http);
    this.forms = new FormsModule(this.http);
    this.tasks = new TasksModule(this.http);
    this.workflows = new WorkflowsModule(this.http);
    this.media = new MediaModule(this.http);
    this.notifications = new NotificationsModule(this.http);
    this.reports = new ReportsModule(this.http);
    this.analytics = new AnalyticsModule(this.http);
    this.assets = new AssetsModule(this.http);
    this.scheduling = new SchedulingModule(this.http);
    this.rules = new RulesModule(this.http);
    this.subscription = new SubscriptionModule(this.http);
    this.licensing = new LicensingModule(this.http);
    this.entitlements = new EntitlementsModule(this.http);
    this.configuration = new ConfigurationModule(this.http);
  }

  public setAccessToken(token: string | undefined): void {
    this.http.setAccessToken(token);
  }

  public setTenantId(tenantId: string | undefined): void {
    this.http.setTenantId(tenantId);
  }

  public setApplicationId(appId: string | undefined): void {
    this.http.setApplicationId(appId);
  }
}
