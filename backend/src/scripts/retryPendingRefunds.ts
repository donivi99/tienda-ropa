import 'dotenv/config';
import { retryPendingRefunds } from '../services/paymentService.js';

async function main() {
  const result = await retryPendingRefunds();
  console.log(
    `Reembolsos pendientes: ${result.processed} procesados, ${result.resolved} resueltos, ${result.failed} fallidos`,
  );
  process.exit(result.failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
