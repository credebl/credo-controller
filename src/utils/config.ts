export const IsCustomDocumentLoaderEnabled = (): boolean => {
  const flag = process.env.ENABLE_CUSTOM_DOCUMENT_LOADER ?? 'false'
  const isCustomDocumentLoaderEnabled = flag.toLowerCase() === 'true'

  if (isCustomDocumentLoaderEnabled) {
    if (!process.env.DEPRECATED_DOMAIN || !process.env.CURRENT_DOMAIN) {
      console.error(
        `Custom document loader for the agent is enabled but the deprecated domain and updated domain is not set`,
      )
    }
    console.warn(
      `Custom document loader for the agent is enabled. Resolution of all URLs from the deprecated domain(${process.env.DEPRECATED_DOMAIN}) will actually be resolved from the current, updated domain(${process.env.CURRENT_DOMAIN})`,
    )
  }

  return isCustomDocumentLoaderEnabled
}
