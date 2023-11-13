export default class ThirdPartyServiceException extends Error {
    constructor(message, originalError, service) {
        super(message)
        this.originalError = originalError
        this.service = service
    }
}
