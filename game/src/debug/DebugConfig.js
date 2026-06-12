export default class DebugConfig {
    static enabled = true;

    static doInWorldDebugInfo = true;
    static doLogGameplayInfo = true;
    static doShowBlueprints = true;
    static doShowCoordinateText = true;
    static doLogInputs = false;
    static doShowAxes = true;
    static doDrawRays = false;

    static logGameplayInfo(message) {
        if (this.enabled && this.doLogGameplayInfo) {
            console.log(message);
        }
    }
}
