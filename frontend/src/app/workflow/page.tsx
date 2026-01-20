'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Step {
  id: string;
  step_order: number;
  message: string;
  media_url?: string;
  delay_hours: number;
  trigger_condition?: any;
}

export default function WorkflowBuilderPage() {
  const router = useRouter();
  const [steps, setSteps] = useState<Step[]>([]);
  const [campaignId, setCampaignId] = useState('');
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const campaignIdParam = urlParams.get('campaign_id');

    if (campaignIdParam) {
      setCampaignId(campaignIdParam);
      fetchSteps(campaignIdParam);
    }

    setLoading(false);
  }, [campaignIdParam]);

  const fetchSteps = async (id: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/dm/campaigns/${id}/steps`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setSteps(data.steps || []);
      }
    } catch (error) {
      console.error('Error fetching steps:', error);
    }
  };

  const addStep = async (newStepData: {
    step_order: number;
    message: string;
    media_url?: string;
    delay_hours?: number;
    trigger_condition?: any;
  }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/dm/campaigns/${campaignId}/steps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newStepData),
      });
      const data = await response.json();
      if (data.success) {
        setSteps([...steps, data.step]);
        setShowAddModal(false);
      } else {
        alert(data.error || 'Failed to add step');
      }
    } catch (error) {
      console.error('Error adding step:', error);
      alert('Failed to add step');
    }
  };

  const updateStep = async (stepId: string, updatedStepData: {
    step_order?: number;
    message?: string;
    media_url?: string;
    delay_hours?: number;
    trigger_condition?: any;
  }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/dm/campaigns/${campaignId}/steps/${stepId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedStepData),
      });
      const data = await response.json();
      if (data.success) {
        setSteps(steps.map(s => s.id === stepId ? data.step : s));
        if (data.step) {
          setSelectedStep(data.step);
        }
      } else {
        alert(data.error || 'Failed to update step');
      }
    } catch (error) {
      console.error('Error updating step:', error);
      alert('Failed to update step');
    }
  };

  const deleteStep = async (stepId: string) => {
    if (!confirm('Are you sure you want to delete this step?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/dm/campaigns/${campaignId}/steps/${stepId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setSteps(steps.filter(s => s.id !== stepId));
        if (selectedStep?.id === stepId) {
          setSelectedStep(null);
        }
      } else {
        alert(data.error || 'Failed to delete step');
      }
    } catch (error) {
      console.error('Error deleting step:', error);
      alert('Failed to delete step');
    }
  };

  const handleSave = async () => {
    alert('Steps saved successfully!');
    router.push(`/dm/campaign/${campaignId}`);
  };

  const handleTest = async () => {
    alert('Test simulation coming soon!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dm" className="text-2xl font-bold text-gray-900 hover:text-indigo-600">
                ← Back to Campaigns
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleTest}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Test Sequence
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                Save Steps
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Step Sequence Builder
                </h2>
              </div>

              <div className="px-4 py-5">
                {steps.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No steps yet. Click "Add Step" to create your first step.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {steps.map((step) => (
                      <div
                        key={step.id}
                        onClick={() => setSelectedStep(step)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedStep?.id === step.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <div className="bg-indigo-100 text-indigo-800 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">
                                {step.step_order + 1}
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {step.message.substring(0, 50)}
                                {step.message.length > 50 ? '...' : ''}
                              </span>
                            </div>
                            <div className="mt-2 space-y-1">
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Delay:</span> {step.delay_hours}h
                              </div>
                              {step.trigger_condition && (
                                <div className="text-sm text-gray-600">
                                    <span className="font-medium">Trigger:</span> {step.trigger_condition.type}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteStep(step.id);
                            }}
                            className="text-red-600 hover:text-red-800 text-sm ml-2"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => setShowAddModal(true)}
                      className="w-full mt-4 px-4 py-3 border-2 border-dashed border-indigo-300 rounded-lg text-indigo-600 font-medium hover:bg-indigo-50 transition-colors"
                    >
                      + Add New Step
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            {selectedStep && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">
                    Step {selectedStep.step_order + 1} Settings
                  </h2>
                </div>

                <div className="px-4 py-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      value={selectedStep.message}
                      onChange={(e) => updateStep(selectedStep.id, { message: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Delay After This Step (hours)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={selectedStep.delay_hours}
                      onChange={(e) => updateStep(selectedStep.id, { delay_hours: parseInt(e.target.value) || 0 })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Trigger Condition Type
                    </label>
                    <select
                      value={selectedStep.trigger_condition?.type || 'none'}
                      onChange={(e) => updateStep(selectedStep.id, {
                        trigger_condition: e.target.value === 'none' ? null : {
                          ...selectedStep.trigger_condition,
                          type: e.target.value,
                        }
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="none">No Condition (Always Execute)</option>
                      <option value="equals">Equals</option>
                      <option value="not_equals">Not Equals</option>
                      <option value="contains">Contains</option>
                      <option value="greater_than">Greater Than</option>
                      <option value="less_than">Less Than</option>
                    </select>
                  </div>

                  {selectedStep.trigger_condition?.type && selectedStep.trigger_condition.type !== 'none' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Trigger Field
                        </label>
                        <select
                          value={selectedStep.trigger_condition?.field || 'user_response'}
                          onChange={(e) => updateStep(selectedStep.id, {
                            trigger_condition: {
                              ...selectedStep.trigger_condition,
                              field: e.target.value,
                            }
                          })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="user_response">User Response</option>
                          <option value="time_since_last_message">Time Since Last Message</option>
                          <option value="user_engagement">User Engagement Level</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Trigger Value
                        </label>
                        <input
                          type="text"
                          value={selectedStep.trigger_condition?.value || ''}
                          onChange={(e) => updateStep(selectedStep.id, {
                            trigger_condition: {
                              ...selectedStep.trigger_condition,
                              value: e.target.value,
                            }
                          })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {showAddModal && (
        <AddStepModal
          onClose={() => setShowAddModal(false)}
          onSave={addStep}
          currentStepOrder={steps.length + 1}
        />
      )}

      {showTestModal && (
        <TestModal
          onClose={() => setShowTestModal(false)}
          steps={steps}
        />
      )}
    </div>
  );
}

function AddStepModal({ onClose, onSave, currentStepOrder }: any) {
  const [message, setMessage] = useState('');
  const [delayHours, setDelayHours] = useState(0);
  const [triggerType, setTriggerType] = useState('none');
  const [triggerField, setTriggerField] = useState('');
  const [triggerValue, setTriggerValue] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newStepData: any = {
      step_order: currentStepOrder,
      message,
      delay_hours: delayHours,
    };

    if (mediaUrl) {
      newStepData.media_url = mediaUrl;
    }

    if (triggerType !== 'none') {
      newStepData.trigger_condition = {
        type: triggerType,
        field: triggerField,
        value: triggerValue,
      };
    }

    onSave(newStepData);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Add New Step
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                id="message"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="delay_hours" className="block text-sm font-medium text-gray-700">
                Delay After This Step (hours)
              </label>
              <input
                type="number"
                id="delay_hours"
                min="0"
                value={delayHours}
                onChange={(e) => setDelayHours(parseInt(e.target.value) || 0)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="trigger_type" className="block text-sm font-medium text-gray-700">
                Trigger Condition Type
              </label>
              <select
                id="trigger_type"
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="none">No Condition (Always Execute)</option>
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="contains">Contains</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
              </select>
            </div>

            {triggerType !== 'none' && (
              <>
                <div>
                  <label htmlFor="trigger_field" className="block text-sm font-medium text-gray-700">
                    Trigger Field
                  </label>
                  <select
                    id="trigger_field"
                    value={triggerField}
                    onChange={(e) => setTriggerField(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="user_response">User Response</option>
                    <option value="time_since_last_message">Time Since Last Message</option>
                    <option value="user_engagement">User Engagement Level</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="trigger_value" className="block text-sm font-medium text-gray-700">
                    Trigger Value
                  </label>
                  <input
                    type="text"
                    id="trigger_value"
                    value={triggerValue}
                    onChange={(e) => setTriggerValue(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </>
            )}

            {mediaUrl && (
              <div>
                <label htmlFor="media_url" className="block text-sm font-medium text-gray-700">
                  Media URL (optional)
                </label>
                <input
                  type="text"
                  id="media_url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Add Step
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function TestModal({ onClose, steps }: any) {
  const [simulating, setSimulating] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleSimulate = async () => {
    setSimulating(true);
    setResults([]);

    await new Promise(resolve => setTimeout(resolve, 2000));

    setResults([
      { step: 1, status: 'success', message: 'Message sent successfully' },
      { step: 2, status: 'waiting', message: 'Waiting for user response...' },
    ]);

    setSimulating(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Test Step Sequence
          </h3>

          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              This will simulate step sequence without actually sending messages.
              <br /><br />
              <strong>Preview:</strong>
              <ul className="mt-2 space-y-2">
                {steps.map((step) => (
                  <li key={step.id} className="flex items-start">
                    <span className="bg-indigo-100 text-indigo-800 rounded-full w-6 h-6 flex items-center justify-center font-bold mr-2 mt-1">
                      {step.step_order + 1}
                    </span>
                    <div>
                      <div className="text-sm">{step.message}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Delay: {step.delay_hours}h
                          {step.trigger_condition && ` | Trigger: ${step.trigger_condition.type}`}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {results.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">Simulation Results</h4>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <span className={`mr-2 ${
                      result.status === 'success'
                        ? 'text-green-600'
                        : 'text-yellow-600'
                      }`}>
                        ●
                      </span>
                      {result.message}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={handleSimulate}
              disabled={simulating}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {simulating ? 'Simulating...' : 'Start Simulation'}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

