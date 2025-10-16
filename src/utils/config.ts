export const IsCustomDocumentLoaderEnabled = (): boolean => {
  const flag = process.env.ENABLE_CUSTOM_DOCUMENT_LOADER ?? 'false'
  return flag.toLowerCase() === 'true'
}
