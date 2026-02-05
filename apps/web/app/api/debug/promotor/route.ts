import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {},
    errors: [],
    dashboardSpecific: {}
  };

  try {
    // 1. Test basic auth session
    debugInfo.checks.authSession = 'testing';
    let session = null;
    try {
      session = await getServerSession(authOptions);
      if (session) {
        debugInfo.checks.authSession = '✅ Session exists';
        debugInfo.sessionInfo = {
          userId: session.user?.id,
          email: session.user?.email,
          role: (session.user as any)?.role,
          hasName: !!session.user?.name
        };
      } else {
        debugInfo.checks.authSession = '❌ No session found';
        debugInfo.errors.push('No active session - user not logged in');
      }
    } catch (error: any) {
      debugInfo.checks.authSession = `❌ Session error: ${error.message}`;
      debugInfo.errors.push(`Auth session: ${error.message}`);
    }

    if (session?.user) {
      const userId = session.user.id;
      const userRole = (session.user as any)?.role;

      // 2. Check user role permissions
      debugInfo.checks.rolePermissions = 'testing';
      if (userRole === 'PROMOTER' || userRole === 'ADMIN') {
        debugInfo.checks.rolePermissions = `✅ Valid role: ${userRole}`;
      } else {
        debugInfo.checks.rolePermissions = `❌ Invalid role: ${userRole}`;
        debugInfo.errors.push(`User role '${userRole}' cannot access promotor dashboard`);
      }

      // 3. Test PromoterProfile table and data
      debugInfo.checks.promoterProfile = 'testing';
      try {
        const promoter = await prisma.promoterProfile.findUnique({
          where: { userId },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                role: true
              }
            }
          }
        });

        if (promoter) {
          debugInfo.checks.promoterProfile = '✅ Promoter profile found';
          debugInfo.dashboardSpecific.promoterProfile = {
            id: promoter.id,
            status: promoter.status,
            businessName: promoter.businessName,
            hasPaymentInfo: !!promoter.paypalEmail || !!promoter.mbwayPhoneNumber,
          };
        } else if (userRole === 'ADMIN') {
          debugInfo.checks.promoterProfile = '✅ Admin user (no promoter profile needed)';
          debugInfo.dashboardSpecific.promoterProfile = 'admin_user';
        } else {
          debugInfo.checks.promoterProfile = '❌ No promoter profile found';
          debugInfo.errors.push('User with PROMOTER role has no PromoterProfile record');
        }
      } catch (error: any) {
        debugInfo.checks.promoterProfile = `❌ Profile error: ${error.message}`;
        debugInfo.errors.push(`Promoter profile: ${error.message}`);
      }

      // 4. Test events data for dashboard
      debugInfo.checks.eventsData = 'testing';
      try {
        let eventsQuery;

        if (userRole === 'ADMIN') {
          // Admin sees all events
          eventsQuery = prisma.event.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              promoterProfile: {
                include: {
                  user: {
                    select: { name: true, email: true }
                  }
                }
              },
              _count: {
                select: {
                  tickets: true,
                  orders: true
                }
              }
            }
          });
        } else {
          // Promoter sees only their events
          const promoter = await prisma.promoterProfile.findUnique({
            where: { userId }
          });

          if (promoter) {
            eventsQuery = prisma.event.findMany({
              where: { promoterProfileId: promoter.id },
              take: 5,
              orderBy: { createdAt: 'desc' },
              include: {
                _count: {
                  select: {
                    tickets: true,
                    orders: true
                  }
                }
              }
            });
          }
        }

        if (eventsQuery) {
          const events = await eventsQuery;
          debugInfo.checks.eventsData = `✅ Events loaded (${events.length} events)`;
          debugInfo.dashboardSpecific.eventsCount = events.length;
          debugInfo.dashboardSpecific.sampleEvents = events.map(e => ({
            id: e.id,
            title: e.title,
            status: e.status,
            ticketCount: e._count?.tickets || 0,
            orderCount: e._count?.orders || 0
          }));
        } else {
          debugInfo.checks.eventsData = '⚠️ No events query executed';
        }
      } catch (error: any) {
        debugInfo.checks.eventsData = `❌ Events error: ${error.message}`;
        debugInfo.errors.push(`Events data: ${error.message}`);
      }

      // 5. Test overview statistics (common dashboard failure point)
      debugInfo.checks.overviewStats = 'testing';
      try {
        let statsQuery = {};

        if (userRole === 'ADMIN') {
          // Admin overview
          const [totalEvents, totalTickets, totalOrders, totalRevenue] = await Promise.all([
            prisma.event.count(),
            prisma.ticket.count(),
            prisma.order.count({ where: { status: 'PAID' } }),
            prisma.order.aggregate({
              where: { status: 'PAID' },
              _sum: { totalAmount: true }
            })
          ]);

          statsQuery = {
            totalEvents,
            totalTickets,
            totalOrders,
            totalRevenue: totalRevenue._sum.totalAmount || 0
          };
        } else {
          // Promoter overview
          const promoter = await prisma.promoterProfile.findUnique({
            where: { userId }
          });

          if (promoter) {
            const [totalEvents, totalTickets, totalOrders, totalRevenue] = await Promise.all([
              prisma.event.count({ where: { promoterProfileId: promoter.id } }),
              prisma.ticket.count({
                where: {
                  event: { promoterProfileId: promoter.id }
                }
              }),
              prisma.order.count({
                where: {
                  status: 'PAID',
                  event: { promoterProfileId: promoter.id }
                }
              }),
              prisma.order.aggregate({
                where: {
                  status: 'PAID',
                  event: { promoterProfileId: promoter.id }
                },
                _sum: { totalAmount: true }
              })
            ]);

            statsQuery = {
              totalEvents,
              totalTickets,
              totalOrders,
              totalRevenue: totalRevenue._sum.totalAmount || 0
            };
          }
        }

        debugInfo.checks.overviewStats = '✅ Overview stats loaded';
        debugInfo.dashboardSpecific.overviewStats = statsQuery;
      } catch (error: any) {
        debugInfo.checks.overviewStats = `❌ Stats error: ${error.message}`;
        debugInfo.errors.push(`Overview stats: ${error.message}`);
      }
    }

    // 6. Test Next.js specific issues
    debugInfo.checks.nextjsIssues = 'testing';
    try {
      // Check if we're in a proper Next.js environment
      const isNextJs = typeof process.env.NEXT_RUNTIME !== 'undefined';
      const hasClientManifest = typeof process.env.__NEXT_PRIVATE_PREBUNDLED_REACT !== 'undefined';

      debugInfo.checks.nextjsIssues = isNextJs ? '✅ Next.js environment detected' : '⚠️ Not in Next.js runtime';
      debugInfo.dashboardSpecific.nextjsEnv = {
        isNextJs,
        hasClientManifest,
        runtime: process.env.NEXT_RUNTIME,
        nodeEnv: process.env.NODE_ENV
      };

      if (!hasClientManifest && process.env.NODE_ENV === 'production') {
        debugInfo.errors.push('Missing client manifest - rebuild required');
        debugInfo.dashboardSpecific.rebuildNeeded = true;
      }
    } catch (error: any) {
      debugInfo.checks.nextjsIssues = `❌ Next.js error: ${error.message}`;
      debugInfo.errors.push(`Next.js environment: ${error.message}`);
    }

  } catch (error: any) {
    debugInfo.criticalError = error.message;
    debugInfo.errors.push(`Critical: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }

  // Generate summary
  const totalChecks = Object.keys(debugInfo.checks).length;
  const passedChecks = Object.values(debugInfo.checks).filter(check =>
    typeof check === 'string' && check.includes('✅')
  ).length;

  debugInfo.summary = {
    totalChecks,
    passedChecks,
    failedChecks: totalChecks - passedChecks,
    hasErrors: debugInfo.errors.length > 0,
    status: debugInfo.errors.length === 0 ? 'HEALTHY' : 'ISSUES_FOUND'
  };

  // Add specific recommendations for promotor dashboard
  debugInfo.recommendations = [];

  if (debugInfo.errors.some((e: string) => e.includes('No active session'))) {
    debugInfo.recommendations.push('User needs to login first');
  }

  if (debugInfo.errors.some((e: string) => e.includes('Invalid role'))) {
    debugInfo.recommendations.push('User role needs to be PROMOTER or ADMIN');
  }

  if (debugInfo.errors.some((e: string) => e.includes('No promoter profile'))) {
    debugInfo.recommendations.push('Create PromoterProfile record for this user');
  }

  if (debugInfo.dashboardSpecific.rebuildNeeded) {
    debugInfo.recommendations.push('Run: rm -rf .next && npm run build && pm2 restart all');
  }

  if (debugInfo.errors.some((e: string) => e.includes('client manifest'))) {
    debugInfo.recommendations.push('Next.js build issue - rebuild application');
  }

  return NextResponse.json(debugInfo, {
    status: debugInfo.errors.length > 0 ? 500 : 200,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}
