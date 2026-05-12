const cron = require('node-cron');
const TestOrder = require('../modules/models/TestOrder');

// This job runs every day at Midnight (00:00)
// For testing purposes, you can change '0 0 * * *' to '*/1 * * * *' to run every 1 minute
const startArchiver = () => {
    cron.schedule('0 0 * * *', async () => {
        console.log('🧹 [CRON] Starting Nightly Data Archival...');
        try {
            // Find records that were ACCESSED and are older than 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const oldRecords = await TestOrder.find({
                status: 'ACCESSED',
                created_at: { $lte: thirtyDaysAgo } // Assuming you have a created_at timestamp
            });

            if (oldRecords.length > 0) {
                console.log(`📦 [CRON] Archiving ${oldRecords.length} old records to Cold Storage...`);
                // In a real app, you would upload to AWS S3 here before deleting.

                const idsToDelete = oldRecords.map(record => record._id);
                await TestOrder.deleteMany({ _id: { $in: idsToDelete } });
                console.log('✅ [CRON] Archival Complete. Active database optimized.');
            } else {
                console.log('✅ [CRON] No old records to archive today.');
            }
        } catch (error) {
            console.error('❌ [CRON] Archival Failed:', error);
        }
    });
};

module.exports = startArchiver;