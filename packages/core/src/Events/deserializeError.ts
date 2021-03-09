import { AccessDenied, InvalidRepoUrl, LockedByAnotherProcess } from '../errors'
import { buildDeserializeError } from '../serialize_errors'

export const deserializeError = buildDeserializeError(AccessDenied, Error, InvalidRepoUrl, LockedByAnotherProcess)
