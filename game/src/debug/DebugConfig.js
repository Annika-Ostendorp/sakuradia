export default class DebugConfig {
  static enabled = false;

  static doInWorldDebugInfo = true;
  static doLogGameplayInfo = true;
  static doShowBlueprints = true;
  static doShowCoordinateText = true;
  static doLogInputs = true;
  static doShowAxes = true;
  static doDrawRays = true;

  static logGameplayInfo(message) {
    if (this.enabled && this.doLogGameplayInfo) {
      console.log(message);
    }
  }
}
