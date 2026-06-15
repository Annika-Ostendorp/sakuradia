export default class DebugConfig {
  static enabled = true;

  static doInWorldDebugInfo = false;
  static doLogGameplayInfo = true;
  static doShowBlueprints = false;
  static doShowCoordinateText = false;
  static doLogInputs = false;
  static doShowAxes = false;
  static doDrawRays = false;

  static logGameplayInfo(message) {
    if (this.enabled && this.doLogGameplayInfo) {
      console.log(message);
    }
  }
}
