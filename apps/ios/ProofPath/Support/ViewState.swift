import Foundation

/// Estado de pantalla como UN SOLO enum — 05-IOS-ARCHITECTURE.md §2.
///
/// `isLoading` + `error` + `data` como propiedades sueltas es la receta para
/// estados imposibles: cargando y con error a la vez, o con datos y con error.
/// Con un enum, esos estados no se pueden representar.
enum ViewState<T> {
    case idle
    case loading
    case loaded(T)
    case failed(AppError)

    var value: T? {
        if case let .loaded(v) = self { return v }
        return nil
    }
}
