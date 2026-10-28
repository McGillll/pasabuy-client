# Service-Layer Architecture

These rules apply to every file under this directory. Preserve the same architecture when the implementation language, framework, transport library, or naming syntax changes.

## Folder structure

```text
api/
|-- BaseAPIService.*          # shared transport and cross-cutting behavior
|-- <standalone>Service.*     # a service not owned by one access domain
|-- admin/                    # administrator-facing resources
|   `-- <Resource>Service.*
|-- auth/                     # authentication and identity operations
|   `-- <Resource>Service.*
|-- customer/                 # authenticated customer resources
|   `-- <Resource>Service.*
|-- public/                   # unauthenticated/public resources
|   `-- Public<Resource>Service.*
|-- settings/                 # configuration resources
|   `-- <Resource>Service.*
`-- user/                     # shared user-related support types
```

Group files by API audience or bounded domain, not by HTTP verb. A service file owns one primary resource. Split a file when it starts coordinating an unrelated resource rather than adding a second service class to it.

## File organization

Keep each resource service in this order:

1. Import the shared base service and domain types.
2. Declare request payload, filter, and response types used only by this service.
3. Declare one resource-focused service class that inherits from the base service.
4. Put collection reads before single-item reads, then create, update, delete, and resource-specific actions.
5. Keep serialization helpers private and place them after public operations.
6. Export one ready-to-use service instance at the bottom of the file.

Shared types belong in the project's type/domain layer once more than one feature uses them. Do not put UI state, component state, or presentation formatting in a service.

## Responsibilities

The base service owns:

- Base URL and transport-client configuration.
- Authentication headers.
- Query-string and request-body serialization shared by all services.
- Cancellation support.
- Normalized API errors and unauthorized-session handling.
- Revalidation/caching primitives such as ETags.
- Multipart transport when uploads are supported.

A resource service owns:

- Endpoint paths for one resource.
- HTTP method selection.
- Typed request contracts and resource-specific response contracts.
- Explicit resource-specific serialization, such as building multipart fields.
- Thin endpoint wrappers; business and presentation logic stay elsewhere.

Never call the framework's HTTP client directly from a resource service. Route every request through the shared base transport. Do not duplicate authentication, base-URL, generic error, or cache handling in resource services.

## Naming contract

- File and class: `<Resource>Service`.
- Public unauthenticated service: `Public<Resource>Service` when a public and protected version both exist.
- Exported instance: the language's lower/camel-case form of the class name, such as `productService`.
- Collection read: `fetch<ResourcePlural>`.
- Single read: `fetch<Resource>` or `fetchById`/`fetchByUuid` when clarity requires it.
- Commands: `create<Resource>`, `update<Resource>`, `delete<Resource>`, or a domain verb such as `approveCustomer`.
- Identifier parameters: use the domain identifier explicitly (`uuid`, `orderUuid`, `productUuid`) rather than a vague `id` when several identifiers occur together.
- Payload types: `<Action><Resource>Payload` or `<Resource>Payload` when shared by create and update.

Match endpoint field names at the API boundary. Translate them elsewhere only when the language or application domain requires it.

## Language-neutral service snippet

Use this shape even when inheritance syntax, visibility keywords, async syntax, or exports differ:

```text
import BaseService
import ResourceTypes

type ResourcePayload {
    requiredField
    optionalField?
}

class ResourceService extends BaseService {
    fetchResources(filters = empty) {
        return base.request("/scope/resources", GET, filters)
    }

    fetchResource(resourceIdentifier) {
        return base.request("/scope/resources/{resourceIdentifier}", GET)
    }

    createResource(payload: ResourcePayload) {
        return base.request("/scope/resources", POST, payload)
    }

    updateResource(resourceIdentifier, payload: ResourcePayload) {
        return base.request("/scope/resources/{resourceIdentifier}", PUT_OR_PATCH, payload)
    }

    deleteResource(resourceIdentifier) {
        return base.request("/scope/resources/{resourceIdentifier}", DELETE)
    }
}

export singleton resourceService = new ResourceService()
```

## Cacheable-read snippet

Keep cache protocol details in the base service. The resource wrapper should only select the endpoint and unwrap the domain data consistently:

```text
fetchResourcesCacheable(filters, cacheTag) {
    result = base.requestCacheable("/scope/resources", filters, cacheTag)

    if result is NOT_MODIFIED {
        return result
    }

    return {
        data: result.data,
        cacheTag: result.cacheTag
    }
}
```

## Multipart snippet

Build multipart data explicitly so the backend contract remains auditable, then send it through the base service's upload/multipart operation:

```text
createResource(payload) {
    multipart = buildMultipart(payload)
    return base.requestMultipart("/scope/resources", POST, multipart)
}

private buildMultipart(payload) {
    multipart = new MultipartData()
    multipart.add("required_field", payload.requiredField)

    if payload.optionalFile exists {
        multipart.add("optional_file", payload.optionalFile)
    }

    return multipart
}
```

Use a real `PUT` or `PATCH` for JSON updates. Do not emulate update verbs by inserting `_method` into a `POST` body. If the server requires multipart updates over `POST`, isolate that compatibility decision in the base transport or document it next to the endpoint contract.

## Review checklist

- One primary resource and one service class per file.
- One exported service instance per file.
- All network calls flow through the base service.
- Endpoint paths include the correct audience/domain prefix.
- Public method names describe domain actions, not transport details.
- Request inputs and non-trivial responses have concrete types where the language supports them.
- Upload fields are appended explicitly and use the shared multipart transport.
- Cacheable methods preserve the not-modified result and return a stable data/tag shape.
- No UI state, notifications, navigation decisions (except centralized auth revocation), or presentation mapping leaks into resource services.
