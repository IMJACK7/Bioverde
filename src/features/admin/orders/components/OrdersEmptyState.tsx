
export default function OrdersEmptyState() {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center px-6 py-16 text-center"
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="text-green-700"
        >
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
      </div>

      <h2 className="text-lg font-semibold text-gray-900">
        Todavía no hay pedidos
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-gray-600">
        Los pedidos aparecerán aquí cuando los clientes
        completen el proceso de compra en BioVerde.
      </p>
    </div>
  );
}
