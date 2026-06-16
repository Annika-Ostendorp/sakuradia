export default class DebugConfig {
  static enabled = true;

  static doInWorldDebugInfo = true;
  static doLogGameplayInfo = false;
  static doShowBlueprints = false;
  static doLogGrid = true;
  static doLogCalculations = false;
  static doShowCoordinateText = false;
  static doLogInputs = false;
  static doShowAxes = false;
  static doDrawRays = false;
  static doShowTileChecks = false;

  static logGameplayInfo(message) {
    if (this.enabled && this.doLogGameplayInfo) {
      console.log(message);
    }
  }
}
