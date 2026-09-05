export const anonymousReporter = "Someone"

export function displayReporter(report) {
  const named = Boolean(report.reporterName)
  return {
    reporterName: named ? report.reporterName : anonymousReporter,
    reporterPhoto: named ? (report.reporterPhoto ?? null) : null,
  }
}
