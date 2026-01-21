const http = require('http');
const fs = require('fs');

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function testWorkflowAPI() {
    console.log('🧪 Testing Workflow API (Native HTTP)...');
    const resultLog = { steps: [], success: false };

    try {
        // 1. Create
        console.log('1️⃣ Creating workflow...');
        const createRes = await request({
            hostname: 'localhost',
            port: 8000,
            path: '/api/workflows',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            name: 'Test Workflow Native',
            nodes: [{ id: '1', type: 'trigger' }],
            edges: [],
            is_active: true
        });
        resultLog.steps.push({ step: 'create', status: createRes.status, data: createRes.data });

        if (!createRes.data.success) throw new Error('Create failed: ' + JSON.stringify(createRes.data));
        const workflowId = createRes.data.data.id;
        console.log('Created ID:', workflowId);

        // 2. List
        console.log('2️⃣ Listing workflows...');
        const listRes = await request({
            hostname: 'localhost',
            port: 8000,
            path: '/api/workflows',
            method: 'GET'
        });
        resultLog.steps.push({ step: 'list', status: listRes.status, count: listRes.data.data.length });

        // 3. Update
        console.log('3️⃣ Updating workflow...');
        const updateRes = await request({
            hostname: 'localhost',
            port: 8000,
            path: `/api/workflows/${workflowId}`,
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        }, {
            name: 'Updated Name Native'
        });
        resultLog.steps.push({ step: 'update', status: updateRes.status, data: updateRes.data });

        // 4. Execute
        console.log('4️⃣ Executing workflow...');
        const execRes = await request({
            hostname: 'localhost',
            port: 8000,
            path: `/api/workflows/${workflowId}/execute`,
            method: 'POST'
        });
        resultLog.steps.push({ step: 'execute', status: execRes.status, data: execRes.data });

        console.log('✅ API Test Passed');
        resultLog.success = true;

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        resultLog.error = error.message;
    } finally {
        fs.writeFileSync('test_workflow_result.json', JSON.stringify(resultLog, null, 2));
        console.log('Result saved to test_workflow_result.json');
    }
}

testWorkflowAPI();
