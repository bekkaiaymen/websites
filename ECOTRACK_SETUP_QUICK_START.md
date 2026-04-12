# Ecotrack Integration - Quick Setup Guide

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js & npm installed
- MongoDB running
- Admin access to the platform

---

## Step 1: Backend Setup

### 1.1 Copy the route file
```bash
# Ensure this file exists:
server/routes/ecotrackIntegration.js
```

### 1.2 Copy the service file
```bash
# Ensure this file exists:
server/services/ecotrackService.js
```

### 1.3 Register routes in `server/index.js`
```javascript
import ecotrackRoutes from './routes/ecotrackIntegration.js';

// Add after other route registrations:
app.use('/api/erp/ecotrack', ecotrackRoutes);
```

### 1.4 Add environment variables to `.env`
```env
# Ecotrack Configuration
ECOTRACK_ENABLED=true
ECOTRACK_COMMISSION_RATE=0.02
UPLOAD_DIR=./uploads/ecotrack
MAX_UPLOAD_SIZE=50mb
```

### 1.5 Create required directories
```bash
mkdir -p uploads/ecotrack
```

---

## Step 2: Frontend Setup

### 2.1 Copy component files
```bash
# These files should be in client/src/components/:
- EcotrackDashboard.jsx
- EcotrackExport.jsx
- EcotrackImport.jsx
```

### 2.2 Add route to Admin panel
In your `client/src/pages/Admin.jsx` or similar:

```javascript
import EcotrackDashboard from '@/components/EcotrackDashboard';

// Inside your admin dashboard JSX:
<EcotrackDashboard adminToken={adminToken} />
```

### 2.3 Add navigation link
```javascript
// In your admin menu/navigation:
<NavLink to="/admin/ecotrack">
  <Truck className="w-5 h-5" />
  Ecotrack Integration
</NavLink>
```

---

## Step 3: Database Setup

### 3.1 Ensure models exist

**Order model needs these fields:**
```javascript
{
  trackingNumber: { type: String, unique: true, index: true },
  status: String, // 'pending', 'in_transit', 'delivered', 'returned', 'notified'
  ecotrackId: String,
  ecotrackLastSync: Date,
  deliveryCompany: ObjectId,
  // ... other fields
}
```

**Create SyncLog model if it doesn't exist:**
```javascript
// server/models/SyncLog.js
const syncLogSchema = new Schema({
  action: { type: String, enum: ['import', 'export'], index: true },
  type: String, // 'order', 'payment', 'return'
  recordId: String,
  originalStatus: String,
  newStatus: String,
  amount: Number,
  details: Object,
  createdAt: { type: Date, default: Date.now, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' }
});

export default mongoose.model('SyncLog', syncLogSchema);
```

### 3.2 Create indexes
```bash
# Run in MongoDB:
use your_database_name;
db.orders.createIndex({ trackingNumber: 1, status: 1 });
db.synclogs.createIndex({ createdAt: -1, action: 1 });
db.synclogs.createIndex({ recordId: 1 });
```

---

## Step 4: Test the Integration

### 4.1 Test backend with curl
```bash
# Get status
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:5000/api/erp/ecotrack/status

# Should return:
{
  "summary": {
    "total": 0,
    "pending": 0,
    "delivered": 0,
    "returned": 0
  },
  "lastSync": null
}
```

### 4.2 Test frontend
1. Go to Admin Dashboard
2. Click "Ecotrack Integration"
3. Should see overview tab with statistics
4. Try export (should show 0 pending if no orders)

### 4.3 Create test order
```javascript
// Create a pending order for testing
const testOrder = new Order({
  trackingNumber: 'TEST-001',
  status: 'pending',
  customerName: 'Test Customer',
  customerPhone: '+213612345678',
  totalPrice: 1500,
  deliveryAddress: {
    wilaya: 'Algiers',
    address: 'Test Address'
  }
});

await testOrder.save();
```

### 4.4 Test export
1. Go to "Export Orders" tab
2. Should show 1 pending order
3. Click "Export 1 Orders to .xlsx"
4. File should download

---

## Step 5: Verify Working

### ✅ Checklist
- [ ] Backend routes registered and accessible
- [ ] Frontend components load without errors
- [ ] Dashboard shows statistics
- [ ] Export button downloads .xlsx file
- [ ] File contains correct columns
- [ ] Import file uploader works
- [ ] Admin can see Ecotrack menu

### 📊 Expected Results

**Export .xlsx should contain:**
- Order Number (Tracking Number)
- Wilaya Code (16 for Algiers, etc.)
- Customer Name
- Phone Number
- Amount
- Reference

**Dashboard should show:**
- Total Orders: 1+
- Pending: 0+ (orders ready to export)
- Delivered: 0+ (completed deliveries)
- Returned: 0+ (returned orders)

---

## Troubleshooting

### Issue: "Cannot find module 'ecotrackIntegration'"
**Solution**: 
```bash
# Verify file exists:
ls server/routes/ecotrackIntegration.js
```

### Issue: Dashboard shows empty
**Solution**:
```javascript
// Check browser console for errors
// Verify adminToken is valid
// Check network tab for failed requests
```

### Issue: Export shows 0 pending orders
**Solution**:
```bash
# Check orders in database:
db.orders.find({ status: 'pending' }).count()
```

### Issue: File upload fails
**Solution**:
```bash
# Check upload directory permissions:
ls -la uploads/ecotrack
chmod 755 uploads/ecotrack
```

---

## Common Configuration

### Wilaya Codes Reference
```javascript
const wilayaCodes = {
  'Algiers': 16,
  'Oran': 31,
  'Constantine': 25,
  'Annaba': 23,
  'Guelma': 24,
  'Setif': 19,
  'Batna': 5,
  'Bechar': 8,
  'Bejaia': 6,
  'Blida': 9,
  'Boumerdes': 35,
  'Chlef': 2,
  'Djelfa': 17,
  'El Bayadh': 32,
  'El Oued': 39,
  'El Tarf': 36,
  'Ghardaia': 47,
  'Jijel': 18,
  'Khenchela': 33,
  'Laghouat': 3,
  'Mascara': 29,
  'Medea': 26,
  'Mila': 43,
  'Mostaganem': 27,
  'Msila': 28,
  'Naama': 45,
  'Relizane': 48,
  'Saida': 20,
  'Skikda': 21,
  'Souk Ahras': 41,
  'Tamanrasset': 11,
  'Tebessa': 12,
  'Tiaret': 14,
  'Tindouf': 37,
  'Tipasa': 42,
  'Tlemcen': 13,
  'Tizi Ouzou': 15,
  'Adrar': 1,
  'Aïn Defla': 44,
  'Aïn Temouchent': 46,
  'Alger': 16,
  'Araar': 47,
  'Sahraoui': 52,
  'Tamanrasset': 11,
  'Béjaïa': 6,
  'Bordj Baj Mokhtar': 10,
  'Bordj Badji Mokhtar': 10
};
```

### Commission Settings
```javascript
const COMMISSION_RATES = {
  DELIVERY: 0.02,      // 2% for successful deliveries
  RETURN: 1.0,         // 100% for returned orders
  PARTIAL: 0.5         // 50% for partial/damaged
};
```

---

## Next Steps

After successful setup:

1. **Configure webhook** (optional):
   ```javascript
   // For automatic Ecotrack API updates
   POST /api/erp/ecotrack/webhook
   ```

2. **Set up monitoring**:
   - Check sync logs regularly
   - Monitor success rates
   - Alert on failures

3. **Enable auto-sync** (Phase 2):
   - Schedule periodic exports
   - Automatic reconciliation imports

4. **Generate reports**:
   - Revenue analytics
   - Delivery performance
   - Merchant payouts

---

## Support

**Need help?**
- Check [ECOTRACK_INTEGRATION_COMPLETE.md](./ECOTRACK_INTEGRATION_COMPLETE.md) for detailed docs
- Review [ecotrackService.js](./server/services/ecotrackService.js) for implementation
- Check server logs: `tail -f logs/server.log | grep ecotrack`

---

**Status**: ✅ Ready for Deployment  
**Last Updated**: 2024-01-15  
**Version**: 1.0.0
