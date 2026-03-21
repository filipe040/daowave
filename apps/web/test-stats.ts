import { AnalyticsService } from './lib/services/analytics';
import { prisma } from './lib/prisma';

async function main() {
  try {
    const org = await prisma.organization.findFirst();
    if (!org) {
      console.log('No org found to test');
      return;
    }
    console.log('Testing with orgId:', org.id);
    const stats = await AnalyticsService.getDetailedStats(org.id);
    console.log('Stats OK');
    const history = await AnalyticsService.getSalesHistory(org.id, 30);
    console.log('History OK');
  } catch (err) {
    console.error('ERROR CAUGHT:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
