# Ecotrack Integration - API Testing Guide

## Testing Endpoints & Scenarios

This guide provides complete testing instructions for all Ecotrack integration endpoints.

---

## Prerequisites

- Valid admin JWT token
- MongoDB with test data
- Postman or curl
- Sample Excel files

---

## API Base URL
```
http://localhost:5000/api/erp/ecotrack
```

---

## 1. Status Endpoint

### Get Sync Status

```http
GET /api/erp/ecotrack/status
Authorization: Bearer {admin_token}
```

### cURL Example
```bash
curl -X GET http://localhost:5000/api/erp/ecotrack/status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

### Expected Response (200 OK)
```json
{
  "summary": {
    "total": 45,
    "pending": 12,
    "in_transit": 8,
    "delivered": 20,
    "returned": 5,
    "notified": 0
  },
  "lastSync": "2024-01-15T10:30:00Z",
  "syncStatus": "active",
  "connectionStatus": "connected",
  "lastError": null
}
```

### Test Cases

| Case | Expected | Actual |
|------|----------|--------|
| No orders | total=0, pending=0 | |
| With pending orders | pending>0 | |
| Mixed statuses | All counts correct | |
| Invalid token | 401 Unauthorized | |

---

## 2. Export Endpoint

### Export Pending Orders

```http
GET /api/erp/ecotrack/export
Authorization: Bearer {admin_token}
```

### cURL Example
```bash
curl -X GET http://localhost:5000/api/erp/ecotrack/export \
  -H "Authorization: Bearer {admin_token}" \
  -o export_$(date +%s).xlsx
```

### Postman Setup
1. Method: GET
2. URL: `http://localhost:5000/api/erp/ecotrack/export`
3. Headers:
   - `Authorization`: `Bearer {your_token}`
4. Send
5. Right-click response → Save response to file

### Expected Response (200 OK)
- File downloads as `.xlsx`
- Filename: `ecotrack_export_YYYY-MM-DD.xlsx`

### Verify Download
```bash
# Check file size
ls -lh export_*.xlsx

# Open and verify content
npm install -D xlsx
node -e "const XLSX = require('xlsx'); const wb = XLSX.readFile('export_*.xlsx'); console.log(wb.SheetNames)"
```

### Excel File Structure

**Expected Columns:**
```
A: Order Number (Tracking)
B: Wilaya Code
C: Customer Name
D: Customer Phone
E: Amount
F: Reference
G: Remarks
```

**Expected Data (Sample):**
```
Order Number    | Wilaya Code | Customer Name  | Phone         | Amount | Reference  | Remarks
REF-001        | 16          | Ahmed Benkada  | +213612345678 | 1500   | REF-001    | 
REF-002        | 31          | Fatima Medel   | +213712345679 | 2000   | REF-002    |
REF-003        | 25          | Karim Zouari   | +213812345680 | 1200   | REF-003    |
```

### Test Scenarios

#### Scenario 1: No Pending Orders
```javascript
// Setup
await Order.deleteMany({ status: 'pending' });

// Test
GET /export

// Expected
Empty file or message "No pending orders"
```

#### Scenario 2: Export with 10 Orders
```javascript
// Setup
for(let i=0; i<10; i++) {
  await new Order({
    trackingNumber: `TEST-${i}`,
    status: 'pending',
    customerName: `Customer ${i}`,
    customerPhone: '+213612345678',
    totalPrice: 1500,
    deliveryAddress: { wilaya: 'Algiers' }
  }).save();
}

// Test
GET /export

// Expected
File with 10 rows (plus header)
All wilayas mapped to codes
All phones normalized
```

#### Scenario 3: Invalid Token
```bash
curl -X GET http://localhost:5000/api/erp/ecotrack/export \
  -H "Authorization: Bearer invalid_token"

# Expected
401 Unauthorized
```

---

## 3. Import Endpoint

### Import Reconciliation File

```http
POST /api/erp/ecotrack/import
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data

Body:
file: [binary file]
```

### cURL Example
```bash
curl -X POST http://localhost:5000/api/erp/ecotrack/import \
  -H "Authorization: Bearer {admin_token}" \
  -F "file=@reconciliation.xlsx"
```

### Postman Setup
1. Method: POST
2. URL: `http://localhost:5000/api/erp/ecotrack/import`
3. Headers:
   - `Authorization`: `Bearer {your_token}`
4. Body:
   - Type: form-data
   - Key: `file`, Type: File
   - Value: Select reconciliation file
5. Send

### Expected Response (200 OK)
```json
{
  "success": true,
  "message": "Import completed successfully",
  "summary": {
    "processed": 10,
    "delivered": 7,
    "returned": 2,
    "errors": 1,
    "totalAmount": 12500
  },
  "updated": [
    {
      "trackingNumber": "REF-001",
      "status": "delivered",
      "oldStatus": "pending",
      "amount": 1500,
      "commission": 30,
      "merchantCredit": 1470
    }
  ],
  "errors": [
    {
      "trackingNumber": "REF-011",
      "error": "Order not found"
    }
  ]
}
```

### Supported File Formats

#### Excel Format (.xlsx)
```
Tracking | Status    | Amount | Notes
REF-001  | Livré     | 1500   | 
REF-002  | Retourné  | 2000   | 
REF-003  | Livré     | 1200   |
```

#### CSV Format
```csv
Tracking,Status,Amount,Notes
REF-001,Livré,1500,
REF-002,Retourné,2000,
REF-003,Livré,1200,
```

### Status Mappings
- `Livré` / `Delivered` → 'delivered'
- `Retourné` / `Returned` → 'returned'
- `En cours` / `In Progress` → 'in_transit'

### Test Scenarios

#### Scenario 1: Simple Import (3 Deliveries)
```javascript
// Setup: Create 3 pending orders
const orders = [];
for(let i=1; i<=3; i++) {
  orders.push(await new Order({
    trackingNumber: `IMP-${i}`,
    status: 'pending',
    customerName: `Customer ${i}`,
    totalPrice: 1000 + (i*100),
    merchant: merchantId
  }).save());
}

// Create CSV file
const csv = `Tracking,Status,Amount
IMP-1,Livré,1100
IMP-2,Livré,1200
IMP-3,Livré,1300`;
fs.writeFileSync('test_import.csv', csv);

// Test
POST /import with test_import.csv

// Expected Response
{
  success: true,
  summary: { processed: 3, delivered: 3, returned: 0, errors: 0 },
  updated: [
    { trackingNumber: 'IMP-1', status: 'delivered' },
    { trackingNumber: 'IMP-2', status: 'delivered' },
    { trackingNumber: 'IMP-3', status: 'delivered' }
  ]
}

// Verify DB
- 3 orders should have status='delivered'
- 3 SyncLog records created
- 3 WalletTransactions created
- Merchant balance updated: 1100*0.98 + 1200*0.98 + 1300*0.98 = 3456
```

#### Scenario 2: Mixed Deliveries & Returns
```javascript
// Setup
// Create 2 deliveries + 2 returns
// ... create orders ...

// Create file with mixed statuses
const csv = `Tracking,Status
MIX-1,Livré
MIX-2,Retourné
MIX-3,Livré
MIX-4,Retourné`;

// Test
POST /import

// Expected
delivered: 2
returned: 2
Wallet: +amount1 +amount2 -amount3 -amount4
```

#### Scenario 3: Error Handling - Invalid Tracking
```javascript
// Create file with invalid tracking numbers
const csv = `Tracking,Status
INVALID-999,Livré
NOTFOUND-888,Retourné`;

// Test
POST /import

// Expected
{
  success: true,
  summary: { processed: 2, delivered: 0, returned: 0, errors: 2 },
  errors: [
    { trackingNumber: 'INVALID-999', error: 'Order not found' },
    { trackingNumber: 'NOTFOUND-888', error: 'Order not found' }
  ]
}
```

#### Scenario 4: Invalid File Format
```bash
curl -X POST http://localhost:5000/api/erp/ecotrack/import \
  -H "Authorization: Bearer {token}" \
  -F "file=@document.txt"

# Expected
400 Bad Request
{
  "error": "Only .xlsx, .xls, and .csv files are supported"
}
```

---

## 4. History Endpoint

### Get Sync History

```http
GET /api/erp/ecotrack/history?limit=50&offset=0&action=import
Authorization: Bearer {admin_token}
```

### Query Parameters
- `limit`: Number of records (default: 50)
- `offset`: Pagination offset (default: 0)
- `action`: 'import' | 'export' | 'all' (default: all)
- `startDate`: ISO date (all records after this)
- `endDate`: ISO date (all records before this)

### cURL Example
```bash
curl -X GET "http://localhost:5000/api/erp/ecotrack/history?limit=10&action=import" \
  -H "Authorization: Bearer {admin_token}"
```

### Expected Response (200 OK)
```json
{
  "total": 25,
  "limit": 10,
  "offset": 0,
  "records": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "action": "import",
      "type": "order",
      "recordId": "REF-001",
      "originalStatus": "pending",
      "newStatus": "delivered",
      "amount": 1500,
      "details": {
        "commission": 30,
        "merchantCredit": 1470
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "createdBy": {
        "_id": "507f1f77bcf86cd799439012",
        "email": "admin@example.com",
        "name": "Admin User"
      }
    }
  ]
}
```

### Test Scenarios

#### Scenario 1: Get Last 10 Imports
```bash
curl -X GET "http://localhost:5000/api/erp/ecotrack/history?limit=10&action=import" \
  -H "Authorization: Bearer {token}"

# Expected
Latest 10 import records
```

#### Scenario 2: Pagination
```bash
# Page 1
curl "...?limit=20&offset=0"

# Page 2
curl "...?limit=20&offset=20"

# Page 3
curl "...?limit=20&offset=40"
```

#### Scenario 3: Date Range
```bash
# Imports from last 7 days
curl "...?action=import&startDate=2024-01-08&endDate=2024-01-15"
```

---

## Integration Test Script

### Complete Flow Test

```javascript
// test-ecotrack-flow.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_URL = 'http://localhost:5000/api/erp/ecotrack';
const TOKEN = 'your_admin_token';

const headers = {
  'Authorization': `Bearer ${TOKEN}`
};

async function testEcotrackFlow() {
  console.log('Starting Ecotrack integration test...\n');

  try {
    // 1. Get Status
    console.log('1️⃣ Testing GET /status');
    const statusRes = await axios.get(`${API_URL}/status`, { headers });
    console.log('✓ Status:', statusRes.data.summary);
    console.log();

    // 2. Export
    if (statusRes.data.summary.pending > 0) {
      console.log('2️⃣ Testing GET /export');
      const exportRes = await axios.get(`${API_URL}/export`, 
        { headers, responseType: 'arraybuffer' }
      );
      fs.writeFileSync('export_test.xlsx', exportRes.data);
      console.log('✓ Export downloaded:', fs.statSync('export_test.xlsx').size, 'bytes');
      console.log();

      // 3. Import (if we have export)
      console.log('3️⃣ Testing POST /import');
      const form = new FormData();
      form.append('file', fs.createReadStream('export_test.xlsx'));
      
      const importRes = await axios.post(
        `${API_URL}/import`,
        form,
        { 
          headers: { ...headers, ...form.getHeaders() }
        }
      );
      console.log('✓ Import Result:', {
        processed: importRes.data.summary.processed,
        delivered: importRes.data.summary.delivered,
        returned: importRes.data.summary.returned,
        errors: importRes.data.summary.errors
      });
      console.log();
    }

    // 4. Get History
    console.log('4️⃣ Testing GET /history');
    const historyRes = await axios.get(`${API_URL}/history?limit=5`, { headers });
    console.log(`✓ Last 5 sync records:`);
    historyRes.data.records.forEach(r => {
      console.log(`  - ${r.action}: ${r.recordId} (${r.newStatus})`);
    });
    console.log();

    console.log('✅ All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testEcotrackFlow();
```

### Run Integration Test
```bash
node test-ecotrack-flow.js
```

---

## Performance Benchmarks

### Expected Performance

```
Operation           | Records | Time   | Notes
--------------------|---------|--------|------------------
Export              | 100     | 2-3s   | Includes Excel gen
Export              | 1000    | 5-8s   | Large batch
Import              | 100     | 1-2s   | CSV parsing
Import              | 500     | 3-5s   | Multiple DB writes
Status Query        | N/A     | <100ms | Cached stats
History Query       | 50      | <100ms | Index optimized
```

### Load Testing

```bash
# Install artillery
npm install -g artillery

# Create load-test.yml
cat > load-test.yml << 'EOF'
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
  variables:
    token: "your_token"
scenarios:
  - name: 'Export Load Test'
    flow:
      - get:
          url: '/api/erp/ecotrack/export'
          headers:
            Authorization: 'Bearer {{ token }}'
EOF

# Run load test
artillery run load-test.yml
```

---

## Troubleshooting Test Issues

### Common Issues

#### 1. 401 Unauthorized
```
Error: Token is invalid or expired
Solution: Get fresh admin token, verify token is Bearer format
```

#### 2. 404 Not Found
```
Error: Endpoint not found
Solution: Verify routes are registered in server/index.js
```

#### 3. ENOENT: No Such File
```
Error: File not found for import
Solution: Verify file path, ensure file exists before reading
```

#### 4. Timeout
```
Error: Request timeout
Solution: Check server is running, check network connectivity
```

#### 5. Invalid File Format
```
Error: Only .xlsx, .xls, and .csv files are supported
Solution: Convert file to supported format or create sample file
```

---

## Monitoring Test Results

### Success Criteria

✅ All endpoints respond with correct status codes  
✅ Export downloads valid Excel files  
✅ Import processes records correctly  
✅ Commission calculated accurately  
✅ Wallet transactions created  
✅ SyncLog entries recorded  
✅ Error handling works  

### Logging Test Output

```javascript
// Enable debug logging
process.env.DEBUG_ECOTRACK = 'true';

// In service:
if (process.env.DEBUG_ECOTRACK) {
  console.log('[ECOTRACK]', message);
}
```

---

## Production Testing

### Pre-Production Checklist

- [ ] All test scenarios pass
- [ ] Performance benchmarks acceptable
- [ ] Error handling verified
- [ ] Database backups created
- [ ] Monitoring alerts configured
- [ ] Documentation reviewed
- [ ] Team trained on procedures

---

**Status**: Ready for Testing  
**Last Updated**: 2024-01-15  
**Version**: 1.0.0
