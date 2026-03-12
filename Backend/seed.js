require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Resource = require('./models/Resource');
const { Request, Conversation, Message, Review, Notification } = require('./models/index');

// ─── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_PASSWORD = 'Password123!';

const demoUsers = [
    { firstName: 'Janhvi', lastName: 'Nigam', email: 'janhvi@university.edu', university: 'MIT', department: 'Computer Science', year: 3, bio: 'CS enthusiast sharing resources and helping fellow students.' },
    { firstName: 'Alex', lastName: 'Chen', email: 'alex@university.edu', university: 'Stanford University', department: 'Electrical Engineering', year: 2, bio: 'EE student with a passion for circuit design and embedded systems.' },
    { firstName: 'Priya', lastName: 'Sharma', email: 'priya@university.edu', university: 'MIT', department: 'Mathematics', year: 4, bio: 'Math major who loves sharing notes and textbooks.' },
    { firstName: 'Marcus', lastName: 'Johnson', email: 'marcus@university.edu', university: 'Harvard University', department: 'Physics', year: 1, bio: 'Freshman looking to share and find physics resources.' },
    { firstName: 'Emma', lastName: 'Wilson', email: 'emma@university.edu', university: 'Stanford University', department: 'Data Science', year: 3, bio: 'Data science student sharing ML and stats resources.' },
];

const demoResources = [
    { title: 'Introduction to Algorithms (CLRS) - 4th Edition', description: 'Classic algorithms textbook in excellent condition. Covers sorting, graph algorithms, dynamic programming, and more. Minimal highlighting.', category: 'Books', subject: 'Algorithms', condition: 'Good', priceType: 'Exchange', price: 0, tags: ['algorithms', 'cs', 'textbook', 'clrs'], views: 142, bookmarkCount: 23 },
    { title: 'Data Structures & OOP Lecture Notes — Full Semester', description: 'Comprehensive handwritten notes covering linked lists, trees, heaps, graphs, OOP principles, design patterns. 120+ pages scanned as PDF.', category: 'Notes', subject: 'Data Structures', condition: 'New', priceType: 'Free', price: 0, tags: ['data-structures', 'oop', 'notes', 'cs'], views: 289, bookmarkCount: 67 },
    { title: 'Arduino Starter Kit with Sensors Bundle', description: 'Complete Arduino Uno R3 starter kit with 15 sensors, breadboard, jumper wires, LCD display, and servo motors. Used for one semester project.', category: 'Electronics', subject: 'Embedded Systems', condition: 'Good', priceType: 'Sale', price: 35, tags: ['arduino', 'electronics', 'sensors', 'iot'], views: 98, bookmarkCount: 15 },
    { title: 'Calculus: Early Transcendentals by James Stewart', description: '8th edition calculus textbook. Covers single and multivariable calculus. Some notes in margins but all pages intact.', category: 'Books', subject: 'Calculus', condition: 'Used', priceType: 'Rent', price: 5, rentDuration: 'Per Week', tags: ['calculus', 'math', 'textbook'], views: 175, bookmarkCount: 31 },
    { title: 'Organic Chemistry Model Kit (240 pieces)', description: 'Molecular model kit for organic chemistry. All atoms and bonds included. Great for visualizing 3D structures.', category: 'Lab Tools', subject: 'Chemistry', condition: 'New', priceType: 'Exchange', price: 0, tags: ['chemistry', 'organic', 'lab', 'models'], views: 54, bookmarkCount: 8 },
    { title: 'Python Machine Learning Notes + Jupyter Notebooks', description: 'Complete ML course notes with runnable Jupyter notebooks. Covers regression, classification, neural networks, NLP basics, and scikit-learn.', category: 'Notes', subject: 'Machine Learning', condition: 'New', priceType: 'Free', price: 0, tags: ['python', 'ml', 'machine-learning', 'jupyter'], views: 412, bookmarkCount: 89 },
    { title: 'TI-84 Plus CE Graphing Calculator', description: 'Texas Instruments graphing calculator in perfect working condition. Includes USB cable and protective case.', category: 'Electronics', subject: 'Mathematics', condition: 'Good', priceType: 'Sale', price: 45, tags: ['calculator', 'ti-84', 'math', 'graphing'], views: 67, bookmarkCount: 12 },
    { title: 'Linear Algebra Done Right by Axler', description: 'Excellent linear algebra textbook focusing on theory. Perfect for proof-based courses. No markings.', category: 'Books', subject: 'Linear Algebra', condition: 'New', priceType: 'Exchange', price: 0, tags: ['linear-algebra', 'math', 'textbook', 'proofs'], views: 136, bookmarkCount: 28 },
    { title: 'Physics Lab Report Templates + Data Analysis Scripts', description: 'LaTeX templates for physics lab reports along with Python scripts for error analysis and curve fitting. Used in PHY201.', category: 'Software', subject: 'Physics', condition: 'New', priceType: 'Free', price: 0, tags: ['physics', 'latex', 'python', 'lab-reports'], views: 203, bookmarkCount: 44 },
    { title: 'Premium Drawing Tablet — Wacom Intuos', description: 'Wacom Intuos drawing tablet, great for digital art and note-taking. Includes pen and extra nibs. Light scratches on surface.', category: 'Electronics', subject: 'Digital Art', condition: 'Used', priceType: 'Sale', price: 55, tags: ['wacom', 'tablet', 'drawing', 'art'], views: 91, bookmarkCount: 19 },
];

const demoMessages = [
    ['Hey! I saw your algorithms textbook listing. Is it still available?', 'Yes! It is. Are you interested in exchanging?'],
    ['I have some great data structures notes if you want to trade.', 'That sounds perfect! When can we meet?'],
    ['How about Thursday at the library around 3pm?', 'Works for me! See you there 📚'],
    ['Thanks for the ML notes! They are incredibly helpful.', 'Glad you like them! Let me know if you need help with any topics.'],
    ['Can I borrow the Arduino kit for my project? I will return it in 2 weeks.', 'Sure! Just be careful with the sensors, they are delicate.'],
];

const reviewComments = [
    { rating: 5, comment: 'Amazing resource! Exactly what I needed for my algorithms course. Super responsive and friendly.', tags: ['Reliable', 'As Described', 'Friendly'] },
    { rating: 4, comment: 'Notes were very helpful. A few pages had coffee stains but content was great.', tags: ['Honest', 'Responsive'] },
    { rating: 5, comment: 'The Arduino kit was complete and well-organized. Great experience!', tags: ['Reliable', 'Good Condition', 'As Described'] },
    { rating: 5, comment: 'Best ML notes I have ever used. Clear explanations with working code examples.', tags: ['Reliable', 'As Described', 'Responsive'] },
    { rating: 4, comment: 'Calculus textbook was in good condition. Quick and easy exchange.', tags: ['Honest', 'Friendly'] },
];

// ─── Seed Function ────────────────────────────────────────────────────────────

async function seed() {
    try {
        console.log('🌱 Starting seed process...');
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing demo data (keep any real users)
        console.log('🧹 Clearing old demo data...');
        const demoEmails = demoUsers.map(u => u.email);
        const existingDemoUsers = await User.find({ email: { $in: demoEmails } });
        const existingDemoIds = existingDemoUsers.map(u => u._id);

        if (existingDemoIds.length > 0) {
            await Resource.deleteMany({ postedBy: { $in: existingDemoIds } });
            await Request.deleteMany({ $or: [{ requester: { $in: existingDemoIds } }, { resourceOwner: { $in: existingDemoIds } }] });
            await Conversation.deleteMany({ participants: { $in: existingDemoIds } });
            await Message.deleteMany({ sender: { $in: existingDemoIds } });
            await Review.deleteMany({ $or: [{ reviewer: { $in: existingDemoIds } }, { reviewee: { $in: existingDemoIds } }] });
            await Notification.deleteMany({ recipient: { $in: existingDemoIds } });
            await User.deleteMany({ email: { $in: demoEmails } });
        }

        // 1. Create Users (plain password — User model pre-save hook will hash it)
        console.log('👤 Creating demo users...');
        const users = [];
        for (const u of demoUsers) {
            const user = await User.create({ ...u, password: DEMO_PASSWORD, isEmailVerified: true, isActive: true });
            users.push(user);
            console.log(`   ✅ ${u.firstName} ${u.lastName} (${u.email})`);
        }

        // 2. Create Resources (distribute among users)
        console.log('📦 Creating demo resources...');
        const resources = [];
        for (let i = 0; i < demoResources.length; i++) {
            const owner = users[i % users.length];
            const resource = await Resource.create({
                ...demoResources[i],
                postedBy: owner._id,
                university: owner.university,
                images: [{ url: `https://picsum.photos/seed/resource${i}/400/300` }],
                createdAt: new Date(Date.now() - (demoResources.length - i) * 2 * 24 * 60 * 60 * 1000),
            });
            resources.push(resource);
            console.log(`   ✅ "${resource.title.substring(0, 50)}..." by ${owner.firstName}`);
        }

        // 3. Create Requests
        console.log('📩 Creating demo requests...');
        const requestTypes = ['Borrow', 'Exchange', 'Buy', 'Rent'];
        const requestStatuses = ['Pending', 'Accepted', 'Completed', 'Pending', 'Accepted'];
        const requestMessages = [
            'Hi! I would love to borrow this for my finals prep. Will take great care of it!',
            'I have a similar textbook to exchange. Interested?',
            'Is the price negotiable? I am a fellow CS student.',
            'Can I rent this for two weeks? I only need it for a project.',
            'This would be perfect for my study group. Can we arrange a pickup?',
        ];

        const requests = [];
        for (let i = 0; i < 5; i++) {
            const resource = resources[i];
            const requester = users[(i + 1) % users.length];
            const owner = users[i % users.length];

            const request = await Request.create({
                resource: resource._id,
                requester: requester._id,
                resourceOwner: owner._id,
                requestType: requestTypes[i % requestTypes.length],
                status: requestStatuses[i],
                message: requestMessages[i],
                createdAt: new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000),
            });
            requests.push(request);
            console.log(`   ✅ ${requester.firstName} → ${owner.firstName} (${request.status})`);
        }

        // 4. Create Conversations & Messages
        console.log('💬 Creating demo conversations...');
        for (let i = 0; i < demoMessages.length; i++) {
            const user1 = users[i % users.length];
            const user2 = users[(i + 1) % users.length];
            const resource = resources[i];

            const conversation = await Conversation.create({
                participants: [user1._id, user2._id],
                resource: resource._id,
                lastMessageAt: new Date(Date.now() - (demoMessages.length - i) * 3600000),
                unreadCount: new Map([[user2._id.toString(), 1]]),
            });

            let lastMsg;
            for (let j = 0; j < demoMessages[i].length; j++) {
                const sender = j % 2 === 0 ? user1 : user2;
                lastMsg = await Message.create({
                    conversation: conversation._id,
                    sender: sender._id,
                    content: demoMessages[i][j],
                    createdAt: new Date(Date.now() - (demoMessages[i].length - j) * 600000),
                });
            }

            await Conversation.findByIdAndUpdate(conversation._id, { lastMessage: lastMsg._id });
            console.log(`   ✅ ${user1.firstName} ↔ ${user2.firstName} (${demoMessages[i].length} messages)`);
        }

        // 5. Create Reviews (for completed requests)
        console.log('⭐ Creating demo reviews...');
        for (let i = 0; i < reviewComments.length; i++) {
            const req = requests[i];
            if (req.status === 'Completed' || i < 3) {
                // Mark request as completed if needed for review
                if (req.status !== 'Completed') {
                    await Request.findByIdAndUpdate(req._id, { status: 'Completed' });
                }

                await Review.create({
                    reviewer: req.requester,
                    reviewee: req.resourceOwner,
                    request: req._id,
                    ...reviewComments[i],
                    createdAt: new Date(Date.now() - (reviewComments.length - i) * 86400000),
                });
                console.log(`   ✅ Review ${i + 1}: ${reviewComments[i].rating}⭐`);
            }
        }

        // 6. Create Notifications
        console.log('🔔 Creating demo notifications...');
        const notificationData = [
            { type: 'NEW_REQUEST', title: 'New Request!', message: `${users[1].firstName} wants to borrow your "${resources[0].title.substring(0, 30)}..."` },
            { type: 'REQUEST_ACCEPTED', title: 'Request Accepted!', message: `${users[0].firstName} accepted your request for "${resources[1].title.substring(0, 30)}..."` },
            { type: 'NEW_MESSAGE', title: 'New Message', message: `${users[2].firstName} sent you a message about "${resources[2].title.substring(0, 30)}..."` },
            { type: 'REVIEW_RECEIVED', title: 'New Review!', message: `${users[3].firstName} gave you a 5⭐ review. "Amazing resource!"` },
            { type: 'SYSTEM', title: 'Welcome to UniShare!', message: 'Start sharing resources with your fellow students today! 🎓' },
        ];

        for (let i = 0; i < notificationData.length; i++) {
            const recipient = users[i % users.length];
            await Notification.create({
                recipient: recipient._id,
                ...notificationData[i],
                isRead: i > 2,
                createdAt: new Date(Date.now() - (notificationData.length - i) * 7200000),
            });
            console.log(`   ✅ ${notificationData[i].type} → ${recipient.firstName}`);
        }

        // 7. Add Bookmarks
        console.log('🔖 Adding bookmarks...');
        for (let i = 0; i < users.length; i++) {
            const bookmarkIds = [];
            for (let j = 0; j < 3; j++) {
                const resourceIdx = (i + j + 1) % resources.length;
                bookmarkIds.push(resources[resourceIdx]._id);
            }
            await User.findByIdAndUpdate(users[i]._id, { $set: { bookmarks: bookmarkIds } });
            console.log(`   ✅ ${users[i].firstName}: ${bookmarkIds.length} bookmarks`);
        }

        // ─── Summary ──────────────────────────────────────────────────────────────
        console.log('\n' + '═'.repeat(50));
        console.log('🎉 SEED COMPLETE!');
        console.log('═'.repeat(50));
        console.log(`   👤 Users:          ${users.length}`);
        console.log(`   📦 Resources:      ${resources.length}`);
        console.log(`   📩 Requests:       ${requests.length}`);
        console.log(`   💬 Conversations:  ${demoMessages.length}`);
        console.log(`   ⭐ Reviews:        ${reviewComments.length}`);
        console.log(`   🔔 Notifications:  ${notificationData.length}`);
        console.log('═'.repeat(50));
        console.log('\n📋 Demo Login Credentials:');
        console.log('   Email:    janhvi@university.edu');
        console.log('   Password: Password123!');
        console.log('   (All demo accounts use the same password)');
        console.log('═'.repeat(50));

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed failed:', err);
        await mongoose.disconnect();
        process.exit(1);
    }
}

seed();
