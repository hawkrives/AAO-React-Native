type PrintJobType = {
  copies: number,
  documentName: string,
  deniedReasonFormatted?: string,
  grayscaleFormatted: "Yes" | "No",
  id: string | number, // maybe just "any"...
  paperSizeFormatted: string,
  printerName: string,
  serverName: string,
  status: string | 'DENIED',
  statusDetail?: string,
  statusFormatted: string,
  totalPages: number,
  usageCostFormatted: string,
  usageTimeFormatted: string,
};

type HeldJobType = {
  canRelease: boolean,
  client: string,
} & PrintJobType;

// https://papercut.stolaf.edu:9192/rpc/api/rest/internal/webclient/users/rives/jobs/status
type StatusResponseType = {
  hashCode: number,
  jobs: Array<PrintJobType>,
};

type PrinterType = {
  location: string,
  serverName: string,
  code: string,
  printerName: string,
};

// https://papercut.stolaf.edu:9192/rpc/api/rest/internal/mobilerelease/api/recent-popular-printers
// ?username=rives
type RecentPopularPrintersResponseType = {
  popularPrinters: Array<PrinterType>,
  recentPrinters: Array<PrinterType>,
};

// https://papercut.stolaf.edu:9192/rpc/api/rest/internal/mobilerelease/api/all-printers
// ?username=rives
type AllPrintersResponseType = Array<PrinterType>;

// https://papercut.stolaf.edu:9192/rpc/api/rest/internal/mobilerelease/api/held-jobs/
// ?username=rives
// &printerName=printers\mfc-it
type HeldJobsResponseType = Array<HeldJobType>;
