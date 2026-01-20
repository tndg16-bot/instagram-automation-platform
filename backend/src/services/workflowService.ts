import { query } from '../config/database';

interface WorkflowNode {
    id: string;
    type: string;
    data: any;
    position: { x: number; y: number };
}

interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
}

interface Workflow {
    id?: string;
    user_id: string;
    name: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    is_active: boolean;
    trigger_config?: any;
    created_at?: Date;
    updated_at?: Date;
}

class WorkflowService {
    // Mock storage for development without DB
    private mockWorkflows: Workflow[] = [];

    constructor() {
        // Initialize with some mock data if needed
        this.mockWorkflows = [
            {
                id: 'mock-workflow-1',
                user_id: 'mock-user-id',
                name: 'Auto Reply Workflow',
                nodes: [
                    { id: '1', type: 'trigger', data: { label: 'New Comment' }, position: { x: 250, y: 5 } },
                    { id: '2', type: 'action', data: { label: 'Reply "Thank you!"' }, position: { x: 250, y: 100 } }
                ],
                edges: [
                    { id: 'e1-2', source: '1', target: '2' }
                ],
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            }
        ];
    }

    async createWorkflow(userId: string, data: Partial<Workflow>): Promise<Workflow> {
        if (process.env.MOCK_MODE === 'true') {
            const newWorkflow: Workflow = {
                id: `wf-${Date.now()}`,
                user_id: userId,
                name: data.name || 'Untitled Workflow',
                nodes: data.nodes || [],
                edges: data.edges || [],
                is_active: data.is_active || false,
                trigger_config: data.trigger_config || {},
                created_at: new Date(),
                updated_at: new Date()
            };
            this.mockWorkflows.push(newWorkflow);
            return newWorkflow;
        }

        // Real DB Implementation
        const sql = `
      INSERT INTO workflows (user_id, name, nodes, edges, is_active, trigger_config)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
        const params = [
            userId,
            data.name,
            JSON.stringify(data.nodes),
            JSON.stringify(data.edges),
            data.is_active,
            JSON.stringify(data.trigger_config)
        ];
        const result = await query(sql, params);
        return result.rows[0];
    }

    async getWorkflows(userId: string): Promise<Workflow[]> {
        if (process.env.MOCK_MODE === 'true') {
            // Return all mock workflows (filtering by user_id in real app)
            return this.mockWorkflows;
        }

        const sql = `SELECT * FROM workflows WHERE user_id = $1 ORDER BY updated_at DESC`;
        const result = await query(sql, [userId]);
        return result.rows;
    }

    async getWorkflowById(id: string): Promise<Workflow | null> {
        if (process.env.MOCK_MODE === 'true') {
            return this.mockWorkflows.find(w => w.id === id) || null;
        }

        const sql = `SELECT * FROM workflows WHERE id = $1`;
        const result = await query(sql, [id]);
        return result.rows[0] || null;
    }

    async updateWorkflow(id: string, userId: string, data: Partial<Workflow>): Promise<Workflow | null> {
        if (process.env.MOCK_MODE === 'true') {
            const index = this.mockWorkflows.findIndex(w => w.id === id);
            if (index === -1) return null;

            this.mockWorkflows[index] = {
                ...this.mockWorkflows[index],
                ...data,
                updated_at: new Date()
            };
            return this.mockWorkflows[index];
        }

        const sql = `
      UPDATE workflows 
      SET name = COALESCE($1, name),
          nodes = COALESCE($2, nodes),
          edges = COALESCE($3, edges),
          is_active = COALESCE($4, is_active),
          trigger_config = COALESCE($5, trigger_config),
          updated_at = NOW()
      WHERE id = $6 AND user_id = $7
      RETURNING *
    `;
        const params = [
            data.name,
            data.nodes ? JSON.stringify(data.nodes) : null,
            data.edges ? JSON.stringify(data.edges) : null,
            data.is_active,
            data.trigger_config ? JSON.stringify(data.trigger_config) : null,
            id,
            userId
        ];
        const result = await query(sql, params);
        return result.rows[0] || null;
    }

    async deleteWorkflow(id: string, userId: string): Promise<boolean> {
        if (process.env.MOCK_MODE === 'true') {
            const initialLength = this.mockWorkflows.length;
            this.mockWorkflows = this.mockWorkflows.filter(w => w.id !== id);
            return this.mockWorkflows.length < initialLength;
        }

        const sql = `DELETE FROM workflows WHERE id = $1 AND user_id = $2`;
        const result = await query(sql, [id, userId]);
        return result.rowCount > 0;
    }
}

export default new WorkflowService();
