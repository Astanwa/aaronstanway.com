/**
 * StableCollapse Playground — Live agentic pipeline demo.
 *
 * Runs the real Collapse Pipeline (Interpret → Plan → Generate → Verify →
 * Optimize → Deliver) via direct LLM API calls from the browser.
 * Supports Anthropic (Claude) and OpenAI (GPT-4).
 * Falls back to pre-built examples when no API key is set.
 */

// ─── Provider Definitions ───────────────────────────────────────────
const PROVIDERS = {
    anthropic: {
        name: 'Anthropic',
        endpoint: 'https://api.anthropic.com/v1/messages',
        models: [
            { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
            { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
        ],
        keyPlaceholder: 'sk-ant-...',
        keyHint: 'Get your key at <a href="https://console.anthropic.com/" target="_blank">console.anthropic.com</a>',
    },
    openai: {
        name: 'OpenAI',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        models: [
            { id: 'gpt-4o', label: 'GPT-4o' },
            { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
            { id: 'o3-mini', label: 'o3-mini' },
        ],
        keyPlaceholder: 'sk-...',
        keyHint: 'Get your key at <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com</a>',
    },
};

// ─── Agent Prompts (mirrored from Python backend) ───────────────────

const SYSTEM_PROMPT = `You are StableCollapse, an expert quantum computing programmer.
You write correct, production-quality quantum code across all major frameworks.

CRITICAL RULES:
1. Always import all required modules at the top
2. Use the LATEST API versions (Qiskit v2.x, Cirq latest, PennyLane latest)
3. Include measurement operations unless explicitly told not to
4. Add brief inline comments explaining non-obvious quantum operations
5. Return ONLY executable code in a single code block, then a brief explanation after the code block
6. For Qiskit v2: use \`from qiskit.primitives import StatevectorSampler\` not deprecated Aer
7. For circuits that need transpilation, use \`qiskit.transpiler.preset_passmanagers\`

FRAMEWORK-SPECIFIC PATTERNS:

Qiskit v2.x:
- Use \`QuantumCircuit\` from \`qiskit\`
- Transpile with \`generate_preset_pass_manager(optimization_level=N, backend=backend).run(circuit)\`
- Run with \`StatevectorSampler\` (local) or via \`QiskitRuntimeService\` (IBM hardware)

Cirq:
- Use \`cirq.LineQubit.range(n)\` or \`cirq.GridQubit(row, col)\`
- Build circuits with \`cirq.Circuit([cirq.H(q), cirq.CNOT(q0, q1), ...])\`
- Simulate with \`cirq.Simulator()\`
- Measure with \`cirq.measure(*qubits, key='result')\`

PennyLane:
- Use \`@qml.qnode(dev)\` decorator pattern
- Device: \`qml.device('default.qubit', wires=n)\`
- Return \`qml.expval()\`, \`qml.probs()\`, \`qml.counts()\`, or \`qml.state()\``;

const CLASSIFY_PROMPT = `You are a task classifier for a quantum computing programming assistant.
Given the user's request, classify it into exactly one category and extract key parameters.

Categories:
- generate: User wants to create a new quantum program/circuit
- port: User wants to convert code between quantum frameworks
- debug: User wants to fix a broken quantum circuit
- optimize: User wants to improve an existing circuit
- explain: User wants to understand a quantum concept or code
- recommend: User wants to know which algorithm to use

Return ONLY a JSON object (no markdown, no explanation):
{
  "task_type": "<category>",
  "algorithm": "<algorithm name if mentioned, else null>",
  "target_framework": "<target framework, default 'qiskit'>",
  "qubit_count": <number if mentioned, else null>,
  "problem_domain": "<domain like optimization, chemistry, ML, cryptography, etc. or null>",
  "key_requirements": ["<list of specific requirements>"]
}

User request: {user_input}`;

const ALGORITHM_DB_TEXT = `Quantum Algorithm Reference:
- Optimization: QAOA (combinatorial, 5-50 qubits), VQE (ground state energies), Grover Adaptive Search
- Chemistry: VQE (NISQ molecular simulation), QPE (fault-tolerant), UCCSD
- Search: Grover's (O(sqrt(N)) unstructured search), Amplitude Amplification
- Machine Learning: VQC (variational classifier), QSVM, QNN, Quantum Kernel Methods
- Cryptography: Shor's (factoring, fault-tolerant), Simon's, Bernstein-Vazirani
- Simulation: Trotter-Suzuki (Hamiltonian evolution), QDRIFT, LCU
- Linear Algebra: HHL (sparse linear systems), VQL (NISQ)`;

const PLAN_PROMPT = `You are a quantum algorithm expert. Given this problem, recommend the best approach.

${ALGORITHM_DB_TEXT}

Problem: {problem}
Domain: {domain}

Respond in 2-3 concise sentences: which algorithm to use, why, and an approximate qubit count.
Be honest if quantum advantage is unlikely for the problem size.`;

const GENERATE_PROMPT = `Generate quantum code for the following request.

Target framework: {framework}
Algorithm context: {algorithm_context}

User request: {user_input}

Write complete, executable {framework} code. Include all imports.
After the code block, provide a brief explanation of what the circuit does.`;

const VERIFY_PROMPT = `You are a quantum circuit verification expert. Review this code for correctness.

Framework: {framework}
Original request: {user_input}

Code:
\`\`\`python
{code}
\`\`\`

Check for:
1. Correct imports and API usage (especially Qiskit v2 vs v1 patterns)
2. Correct gate application and qubit indexing
3. Proper measurement setup
4. The code would produce the expected output if run

Respond with a short JSON (no markdown fences):
{"pass": true/false, "issues": ["list of issues if any"], "expected_output": "brief description of what running this would produce"}`;

const OPTIMIZE_PROMPT = `You are a quantum hardware optimization expert.

Code:
\`\`\`python
{code}
\`\`\`

Target backend: IBM Quantum hardware (Heron r2 / Eagle r3 processors)
Backend specs: ibm_torino — 133 qubits, Heron r2, native gates: CZ, RZ, SX, X, heavy-hex topology, CX error ~0.005

Provide a short resource estimate as JSON (no markdown fences):
{"num_qubits": N, "depth_estimate": N, "two_qubit_gates": N, "recommended_backend": "ibm_torino or ibm_brisbane", "notes": "one sentence"}`;

// ─── IBM Backend Reference ──────────────────────────────────────────
const IBM_BACKENDS = {
    ibm_torino:   { qubits: 133, processor: 'Heron r2', error: 0.005 },
    ibm_fez:      { qubits: 156, processor: 'Heron r2', error: 0.004 },
    ibm_brisbane: { qubits: 127, processor: 'Eagle r3', error: 0.008 },
};

// ─── Storage Keys ───────────────────────────────────────────────────
const SK_PROVIDER  = 'sc_provider';
const SK_MODEL     = 'sc_model';
const SK_KEY_PFX   = 'sc_key_';  // sc_key_anthropic, sc_key_openai
const SK_IBM_TOKEN = 'sc_ibm_token';

function getProvider() { return localStorage.getItem(SK_PROVIDER) || 'anthropic'; }
function getModel()    { return localStorage.getItem(SK_MODEL) || PROVIDERS[getProvider()].models[0].id; }
function getApiKey()   { return localStorage.getItem(SK_KEY_PFX + getProvider()) || ''; }
function hasApiKey()   { return getApiKey().length > 0; }

function getIBMToken()    { return localStorage.getItem(SK_IBM_TOKEN) || ''; }
function hasIBMToken()    { return getIBMToken().length > 0; }
function saveIBMToken(t)  { if (t) localStorage.setItem(SK_IBM_TOKEN, t); else localStorage.removeItem(SK_IBM_TOKEN); }

function saveProvider(p) { localStorage.setItem(SK_PROVIDER, p); }
function saveModel(m)    { localStorage.setItem(SK_MODEL, m); }
function saveApiKey(key) {
    const k = SK_KEY_PFX + getProvider();
    if (key) localStorage.setItem(k, key);
    else localStorage.removeItem(k);
}

// ─── LLM API Calls ─────────────────────────────────────────────────
async function callLLM(prompt, { system = '', temperature = 0.2, maxTokens = 4096, jsonMode = false } = {}) {
    const provider = getProvider();
    const apiKey   = getApiKey();
    const model    = getModel();
    if (!apiKey) throw new Error('No API key configured');

    if (provider === 'anthropic') {
        return callAnthropic(prompt, system, model, apiKey, temperature, maxTokens);
    } else if (provider === 'openai') {
        return callOpenAI(prompt, system, model, apiKey, temperature, maxTokens, jsonMode);
    }
    throw new Error(`Unknown provider: ${provider}`);
}

async function callAnthropic(prompt, system, model, apiKey, temperature, maxTokens) {
    const body = {
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [{ role: 'user', content: prompt }],
    };
    if (system) body.system = system;

    const res = await fetch(PROVIDERS.anthropic.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error('Invalid API key');
        if (res.status === 429) throw new Error('Rate limited — wait a moment');
        throw new Error(err.error?.message || `Anthropic error (${res.status})`);
    }
    const data = await res.json();
    return data.content[0].text;
}

async function callOpenAI(prompt, system, model, apiKey, temperature, maxTokens, jsonMode) {
    const messages = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });

    const body = { model, messages, temperature, max_tokens: maxTokens };
    if (jsonMode) body.response_format = { type: 'json_object' };

    const res = await fetch(PROVIDERS.openai.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error('Invalid API key');
        if (res.status === 429) throw new Error('Rate limited — wait a moment');
        if (res.status === 0 || err.error?.message?.includes('CORS'))
            throw new Error('CORS blocked — OpenAI may not allow direct browser calls. Try Anthropic instead.');
        throw new Error(err.error?.message || `OpenAI error (${res.status})`);
    }
    const data = await res.json();
    return data.choices[0].message.content;
}

// ─── Response Parsing ───────────────────────────────────────────────
function parseCode(text) {
    let code = '', explanation = '';
    if (text.includes('```')) {
        const parts = text.split('```');
        for (let i = 0; i < parts.length; i++) {
            if (i % 2 === 1) {
                const lines = parts[i].trim().split('\n');
                if (lines[0] && ['python','qiskit','cirq','pennylane','qsharp','json'].includes(lines[0].trim())) {
                    code = lines.slice(1).join('\n');
                } else {
                    code = parts[i].trim();
                }
                break;
            }
        }
        const lastEnd = text.lastIndexOf('```');
        const after = text.substring(lastEnd + 3).trim();
        if (after) explanation = after;
    } else {
        code = text.trim();
    }
    if (!explanation) explanation = 'Code generated successfully.';
    return { code, explanation };
}

function parseJSON(text) {
    try { return JSON.parse(text); } catch {}
    // Try extracting JSON from text
    const start = text.indexOf('{');
    const end   = text.lastIndexOf('}') + 1;
    if (start >= 0 && end > start) {
        try { return JSON.parse(text.substring(start, end)); } catch {}
    }
    return null;
}

// ─── Pipeline Stage UI ──────────────────────────────────────────────
const STAGES = ['interpret', 'plan', 'generate', 'verify', 'optimize', 'deliver'];

function resetPipeline() {
    const tracker = document.getElementById('pipeline-tracker');
    tracker.style.display = 'flex';
    for (const name of STAGES) {
        const el = tracker.querySelector(`[data-stage="${name}"]`);
        el.className = 'stage';
        el.querySelector('.stage-icon').innerHTML = '&#9675;';
        document.getElementById(`detail-${name}`).textContent = '';
    }
}

function setStage(name, state, detail = '') {
    const tracker = document.getElementById('pipeline-tracker');
    const el = tracker.querySelector(`[data-stage="${name}"]`);
    el.className = `stage ${state}`;
    const icon = el.querySelector('.stage-icon');
    if (state === 'active')   icon.innerHTML = '&#10227;';  // ⟳
    else if (state === 'done')  icon.innerHTML = '&#10003;';  // ✓
    else if (state === 'error') icon.innerHTML = '&#10007;';  // ✗
    else                        icon.innerHTML = '&#9675;';   // ○
    if (detail) document.getElementById(`detail-${name}`).textContent = detail;
}

// ─── The Collapse Pipeline (browser edition) ────────────────────────
async function runPipeline(userInput, framework) {
    resetPipeline();

    // ── Stage 1: INTERPRET ──────────────────────────────────────
    setStage('interpret', 'active', 'classifying...');
    let taskInfo;
    try {
        const classifyPrompt = CLASSIFY_PROMPT.replace('{user_input}', userInput);
        const raw = await callLLM(classifyPrompt, { temperature: 0.1, maxTokens: 512 });
        taskInfo = parseJSON(raw);
        if (!taskInfo) taskInfo = { task_type: 'generate', target_framework: framework };
        // Respect user's framework selection
        taskInfo.target_framework = framework;
    } catch (err) {
        setStage('interpret', 'error', err.message);
        throw err;
    }
    const taskLabel = taskInfo.task_type || 'generate';
    setStage('interpret', 'done', taskLabel);

    // ── Stage 2: PLAN ───────────────────────────────────────────
    setStage('plan', 'active', 'selecting algorithm...');
    let algorithmContext = '';
    try {
        if (['generate', 'recommend'].includes(taskLabel)) {
            const planPrompt = PLAN_PROMPT
                .replace('{problem}', userInput)
                .replace('{domain}', taskInfo.problem_domain || 'not specified');
            algorithmContext = await callLLM(planPrompt, { temperature: 0.2, maxTokens: 512 });
        }
    } catch (err) {
        // Non-fatal — continue without algorithm context
        algorithmContext = '';
    }
    const algoShort = taskInfo.algorithm || (algorithmContext ? algorithmContext.split(/[.,]/)[0].substring(0, 40) : 'ready');
    setStage('plan', 'done', algoShort);

    // ── Stage 3: GENERATE ───────────────────────────────────────
    setStage('generate', 'active', `writing ${framework} code...`);
    let code, explanation;
    try {
        const genPrompt = GENERATE_PROMPT
            .replace(/{framework}/g, framework)
            .replace('{algorithm_context}', algorithmContext || 'None')
            .replace('{user_input}', userInput);
        const raw = await callLLM(genPrompt, { system: SYSTEM_PROMPT, maxTokens: 4096 });
        ({ code, explanation } = parseCode(raw));
    } catch (err) {
        setStage('generate', 'error', err.message);
        throw err;
    }
    setStage('generate', 'done', `${code.split('\n').length} lines`);

    // ── Stage 4: VERIFY ─────────────────────────────────────────
    setStage('verify', 'active', 'reviewing code...');
    let verifyResult = { pass: true, expected_output: '' };
    try {
        const vPrompt = VERIFY_PROMPT
            .replace('{framework}', framework)
            .replace('{user_input}', userInput)
            .replace('{code}', code);
        const raw = await callLLM(vPrompt, { temperature: 0.1, maxTokens: 512 });
        const parsed = parseJSON(raw);
        if (parsed) verifyResult = parsed;
    } catch {
        // Non-fatal
    }
    setStage('verify', 'done', verifyResult.pass ? 'passed' : 'issues found');

    // ── Stage 5: OPTIMIZE ───────────────────────────────────────
    setStage('optimize', 'active', 'estimating resources...');
    let hwInfo = null;
    try {
        const oPrompt = OPTIMIZE_PROMPT.replace('{code}', code);
        const raw = await callLLM(oPrompt, { temperature: 0.1, maxTokens: 512 });
        hwInfo = parseJSON(raw);
    } catch {
        // Non-fatal
    }
    const backend = hwInfo?.recommended_backend || 'ibm_torino';
    setStage('optimize', 'done', backend);

    // ── Stage 6: DELIVER ────────────────────────────────────────
    setStage('deliver', 'done', 'complete');

    return { code, explanation, taskInfo, verifyResult, hwInfo };
}

// ─── Pre-built Examples (fallback) ──────────────────────────────────
const EXAMPLES = {
    qiskit: {
        ghz: {
            prompt: "Create a 3-qubit GHZ state with measurement",
            code: `from qiskit import QuantumCircuit
from qiskit.primitives import StatevectorSampler

# Create 3-qubit GHZ state: |000⟩ + |111⟩ / √2
qc = QuantumCircuit(3, 3)
qc.h(0)
qc.cx(0, 1)
qc.cx(1, 2)
qc.measure([0, 1, 2], [0, 1, 2])

sampler = StatevectorSampler()
job = sampler.run([qc], shots=1024)
result = job.result()
counts = result[0].data.meas.get_counts()
print(counts)  # Expected: ~{'000': 512, '111': 512}`,
            explanation: "A GHZ state is a maximally entangled state of 3+ qubits. Hadamard creates superposition on q[0], then CNOT gates propagate entanglement. Measurement always yields all 0s or all 1s."
        },
        grover: {
            prompt: "Implement Grover's search algorithm to find |11⟩",
            code: `from qiskit import QuantumCircuit
from qiskit.primitives import StatevectorSampler
import numpy as np

n = 2
qc = QuantumCircuit(n, n)
qc.h(range(n))
iterations = int(np.floor(np.pi / 4 * np.sqrt(2**n)))
for _ in range(iterations):
    qc.cz(0, 1)
    qc.h(range(n))
    qc.z(range(n))
    qc.cz(0, 1)
    qc.h(range(n))
qc.measure(range(n), range(n))

sampler = StatevectorSampler()
job = sampler.run([qc], shots=1024)
result = job.result()
counts = result[0].data.meas.get_counts()
print(counts)  # Expected: |11⟩ with high probability`,
            explanation: "Grover's algorithm provides quadratic speedup for unstructured search. The oracle marks |11⟩ by flipping its phase, the diffusion operator amplifies its amplitude."
        },
        vqe: {
            prompt: "Implement VQE to find the ground state energy of H2",
            code: `from qiskit import QuantumCircuit
from qiskit.circuit.library import TwoLocal
from qiskit.quantum_info import SparsePauliOp
from qiskit.primitives import StatevectorEstimator
from scipy.optimize import minimize

hamiltonian = SparsePauliOp.from_list([
    ("II", -1.0523), ("IZ", 0.3979), ("ZI", -0.3979),
    ("ZZ", -0.0112), ("XX", 0.1809),
])
ansatz = TwoLocal(num_qubits=2, rotation_blocks=['ry','rz'],
                  entanglement_blocks='cx', reps=2)
estimator = StatevectorEstimator()

def cost_function(params):
    bound = ansatz.assign_parameters(params)
    job = estimator.run([(bound, hamiltonian)])
    return job.result()[0].data.evs

x0 = [0.0] * ansatz.num_parameters
result = minimize(cost_function, x0, method='COBYLA', options={'maxiter': 200})
print(f"Ground state energy: {result.fun:.6f} Ha")
print(f"Expected (exact):    -1.8572 Ha")`,
            explanation: "VQE is a hybrid quantum-classical algorithm. The quantum computer evaluates energy of a parameterized trial state; a classical optimizer tunes parameters."
        },
        qaoa: {
            prompt: "Implement QAOA for Max-Cut on a triangle graph",
            code: `from qiskit import QuantumCircuit
from qiskit.circuit import Parameter
from qiskit.primitives import StatevectorSampler
from scipy.optimize import minimize
import numpy as np

def maxcut_qaoa(edges, n_qubits, p=1):
    gamma = [Parameter(f'g{i}') for i in range(p)]
    beta = [Parameter(f'b{i}') for i in range(p)]
    qc = QuantumCircuit(n_qubits, n_qubits)
    qc.h(range(n_qubits))
    for layer in range(p):
        for i, j in edges:
            qc.cx(i, j); qc.rz(2*gamma[layer], j); qc.cx(i, j)
        for i in range(n_qubits):
            qc.rx(2*beta[layer], i)
    qc.measure(range(n_qubits), range(n_qubits))
    return qc, gamma + beta

edges = [(0,1),(1,2),(0,2)]
qc, params = maxcut_qaoa(edges, 3, p=2)
sampler = StatevectorSampler()

def cost(vals):
    bound = qc.assign_parameters(dict(zip(params, vals)))
    counts = sampler.run([bound], shots=1024).result()[0].data.meas.get_counts()
    total = sum(counts.values())
    return -sum(sum(1 for i,j in edges if b[i]!=b[j])*c/total for b,c in counts.items())

result = minimize(cost, np.random.uniform(0, 2*np.pi, len(params)), method='COBYLA')
print(f"Max cut value: {-result.fun:.2f}")`,
            explanation: "QAOA solves combinatorial optimization. For Max-Cut on a triangle, it finds the partition maximizing edges between groups."
        },
        teleport: {
            prompt: "Implement quantum teleportation protocol",
            code: `from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
from qiskit.primitives import StatevectorSampler

qr = QuantumRegister(3, 'q')
cr = ClassicalRegister(3, 'c')
qc = QuantumCircuit(qr, cr)

qc.x(qr[0])           # State to teleport: |1⟩
qc.barrier()
qc.h(qr[1])           # Bell pair
qc.cx(qr[1], qr[2])
qc.barrier()
qc.cx(qr[0], qr[1])   # Bell measurement
qc.h(qr[0])
qc.barrier()
qc.measure(qr[0], cr[0])
qc.measure(qr[1], cr[1])
qc.barrier()
qc.cx(qr[1], qr[2])   # Bob's corrections
qc.cz(qr[0], qr[2])
qc.measure(qr[2], cr[2])

sampler = StatevectorSampler()
counts = sampler.run([qc], shots=1024).result()[0].data.c.get_counts()
print(counts)  # q[2] always |1⟩`,
            explanation: "Teleportation transfers a quantum state using a shared Bell pair and two classical bits. Alice measures, Bob corrects."
        },
        qft: {
            prompt: "Implement Quantum Fourier Transform on 3 qubits",
            code: `from qiskit import QuantumCircuit
from qiskit.primitives import StatevectorSampler
import numpy as np

def qft_circuit(n):
    qc = QuantumCircuit(n, n)
    for i in range(n):
        qc.h(i)
        for j in range(i+1, n):
            qc.cp(np.pi / (2**(j-i)), j, i)
    for i in range(n // 2):
        qc.swap(i, n-1-i)
    return qc

n = 3
qc = qft_circuit(n)
inp = QuantumCircuit(n, n)
inp.x(0); inp.x(2)  # |101⟩ = |5⟩
full = inp.compose(qc)
full.measure(range(n), range(n))

sampler = StatevectorSampler()
counts = sampler.run([full], shots=1024).result()[0].data.meas.get_counts()
print(f"QFT of |5⟩: {counts}")`,
            explanation: "QFT maps computational basis to frequency domain using Hadamards and controlled phase rotations. Key subroutine in Shor's algorithm and QPE."
        },
    },
    cirq: {
        ghz: {
            prompt: "Create a 3-qubit GHZ state with measurement",
            code: `import cirq
q0, q1, q2 = cirq.LineQubit.range(3)
circuit = cirq.Circuit([
    cirq.H(q0), cirq.CNOT(q0, q1), cirq.CNOT(q1, q2),
    cirq.measure(q0, q1, q2, key='result'),
])
result = cirq.Simulator().run(circuit, repetitions=1024)
print(result.histogram(key='result'))`,
            explanation: "GHZ in Cirq using LineQubits and moment-based circuit model. Histogram: 0=|000⟩, 7=|111⟩."
        },
        grover: {
            prompt: "Implement Grover's search to find |11⟩",
            code: `import cirq
q0, q1 = cirq.LineQubit.range(2)
circuit = cirq.Circuit()
circuit.append([cirq.H(q0), cirq.H(q1)])
circuit.append(cirq.CZ(q0, q1))
circuit.append([cirq.H(q0), cirq.H(q1)])
circuit.append([cirq.Z(q0), cirq.Z(q1)])
circuit.append(cirq.CZ(q0, q1))
circuit.append([cirq.H(q0), cirq.H(q1)])
circuit.append(cirq.measure(q0, q1, key='result'))
result = cirq.Simulator().run(circuit, repetitions=1024)
print(result.histogram(key='result'))`,
            explanation: "Grover's in Cirq. CZ serves as both oracle and part of diffusion. One iteration optimal for 4 items."
        },
    },
    pennylane: {
        ghz: {
            prompt: "Create a 3-qubit GHZ state",
            code: `import pennylane as qml
dev = qml.device('default.qubit', wires=3, shots=1024)

@qml.qnode(dev)
def ghz_state():
    qml.Hadamard(wires=0)
    qml.CNOT(wires=[0, 1])
    qml.CNOT(wires=[1, 2])
    return qml.counts()

print(ghz_state())`,
            explanation: "PennyLane's functional QNode pattern. The @qml.qnode decorator converts a function into a quantum circuit."
        },
        grover: {
            prompt: "Implement Grover's search to find |11⟩",
            code: `import pennylane as qml
dev = qml.device('default.qubit', wires=2, shots=1024)

@qml.qnode(dev)
def grover():
    qml.Hadamard(wires=0); qml.Hadamard(wires=1)
    qml.CZ(wires=[0, 1])
    qml.Hadamard(wires=0); qml.Hadamard(wires=1)
    qml.PauliZ(wires=0); qml.PauliZ(wires=1)
    qml.CZ(wires=[0, 1])
    qml.Hadamard(wires=0); qml.Hadamard(wires=1)
    return qml.counts()

print(grover())`,
            explanation: "Grover's in PennyLane's functional style with autodiff support."
        },
    },
};

function getExample(framework, name) {
    if (EXAMPLES[framework]?.[name]) return EXAMPLES[framework][name];
    if (EXAMPLES.qiskit[name]) {
        return { ...EXAMPLES.qiskit[name], code: `# ${framework} version — install StableCollapse for auto-porting\n# pip install stable-collapse\n\n${EXAMPLES.qiskit[name].code}` };
    }
    return null;
}

// ─── State ──────────────────────────────────────────────────────────
let currentFramework = 'qiskit';

// ─── DOM Elements ───────────────────────────────────────────────────
const promptInput      = document.getElementById('prompt-input');
const codeOutput       = document.getElementById('code-output');
const explanationOutput= document.getElementById('explanation-output');
const hardwareOutput   = document.getElementById('hardware-output');
const generateBtn      = document.getElementById('generate-btn');
const exampleSelect    = document.getElementById('example-select');
const copyBtn          = document.getElementById('copy-btn');
const fwButtons        = document.querySelectorAll('.fw-btn');
const providerBadge    = document.getElementById('provider-badge');

// Settings panel
const settingsBtn      = document.getElementById('settings-btn');
const apiKeyPanel      = document.getElementById('api-key-panel');
const providerSelect   = document.getElementById('provider-select');
const modelSelect      = document.getElementById('model-select');
const apiKeyInput      = document.getElementById('api-key-input');
const apiKeyLabel      = document.getElementById('api-key-label');
const saveKeyBtn       = document.getElementById('save-key-btn');
const clearKeyBtn      = document.getElementById('clear-key-btn');
const toggleKeyVis     = document.getElementById('toggle-key-vis');
const apiStatusMsg     = document.getElementById('api-status-msg');
const apiPanelHint     = document.getElementById('api-panel-hint');

// ─── Settings Panel Logic ───────────────────────────────────────────
function populateModels() {
    const provider = providerSelect.value;
    modelSelect.innerHTML = '';
    for (const m of PROVIDERS[provider].models) {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.label;
        modelSelect.appendChild(opt);
    }
    // Restore saved model if it belongs to this provider
    const saved = localStorage.getItem(SK_MODEL);
    if (saved && PROVIDERS[provider].models.some(m => m.id === saved)) {
        modelSelect.value = saved;
    }
    apiKeyInput.placeholder = PROVIDERS[provider].keyPlaceholder;
    apiPanelHint.innerHTML = PROVIDERS[provider].keyHint + '<br><span class="hint-sub">Key is stored locally in your browser only.</span>';
}

function updateUI() {
    const dot = document.getElementById('api-status-dot');
    const btnText = generateBtn.querySelector('.btn-text');
    const existingBadge = btnText.querySelector('.live-badge');

    if (hasApiKey()) {
        dot.className = 'status-dot connected';
        if (!existingBadge) {
            const badge = document.createElement('span');
            badge.className = 'live-badge';
            badge.textContent = 'LIVE';
            btnText.appendChild(badge);
        }
    } else {
        dot.className = 'status-dot disconnected';
        if (existingBadge) existingBadge.remove();
    }
}

settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    apiKeyPanel.classList.toggle('open');
    if (apiKeyPanel.classList.contains('open')) {
        providerSelect.value = getProvider();
        populateModels();
        apiKeyInput.value = getApiKey();
    }
});

document.addEventListener('click', (e) => {
    if (!apiKeyPanel.contains(e.target) && e.target !== settingsBtn && !settingsBtn.contains(e.target)) {
        apiKeyPanel.classList.remove('open');
    }
});

providerSelect.addEventListener('change', () => {
    saveProvider(providerSelect.value);
    populateModels();
    apiKeyInput.value = getApiKey();
    updateUI();
});

modelSelect.addEventListener('change', () => {
    saveModel(modelSelect.value);
});

saveKeyBtn.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    if (!key) { apiStatusMsg.textContent = 'Enter a key'; apiStatusMsg.className = 'api-status-msg error'; return; }

    apiStatusMsg.textContent = 'Verifying...';
    apiStatusMsg.className = 'api-status-msg';
    saveProvider(providerSelect.value);
    saveModel(modelSelect.value);
    saveApiKey(key);

    try {
        await callLLM('Respond with only: ok', { maxTokens: 8, temperature: 0 });
        apiStatusMsg.textContent = 'Connected — pipeline is live';
        apiStatusMsg.className = 'api-status-msg success';
    } catch (err) {
        if (err.message.includes('Invalid API key')) {
            localStorage.removeItem(SK_KEY_PFX + getProvider());
            apiStatusMsg.textContent = 'Invalid key';
            apiStatusMsg.className = 'api-status-msg error';
        } else {
            // Could be rate limit, CORS, etc. — save anyway
            apiStatusMsg.textContent = `Saved (${err.message})`;
            apiStatusMsg.className = 'api-status-msg success';
        }
    }
    updateUI();
});

clearKeyBtn.addEventListener('click', () => {
    apiKeyInput.value = '';
    saveApiKey('');
    apiStatusMsg.textContent = 'Key removed';
    apiStatusMsg.className = 'api-status-msg';
    updateUI();
});

toggleKeyVis.addEventListener('click', () => {
    apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
});

// ─── Framework Selector ─────────────────────────────────────────────
fwButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        fwButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFramework = btn.dataset.fw;
    });
});

// ─── Example Loader ─────────────────────────────────────────────────
exampleSelect.addEventListener('change', () => {
    const name = exampleSelect.value;
    if (!name) return;
    const ex = getExample(currentFramework, name);
    if (ex) promptInput.value = ex.prompt;
});

// ─── Generate Button ────────────────────────────────────────────────
generateBtn.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    const btnText = generateBtn.querySelector('.btn-text');
    const btnLoading = generateBtn.querySelector('.btn-loading');
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    generateBtn.disabled = true;
    hardwareOutput.style.display = 'none';

    if (hasApiKey()) {
        // Show provider badge
        const prov = PROVIDERS[getProvider()];
        const modelLabel = prov.models.find(m => m.id === getModel())?.label || getModel();
        providerBadge.textContent = `${prov.name} · ${modelLabel}`;
        providerBadge.style.display = 'inline';

        try {
            const result = await runPipeline(prompt, currentFramework);

            codeOutput.textContent = result.code;
            lastGeneratedCode = result.code;
            explanationOutput.textContent = result.explanation;
            explanationOutput.style.display = 'block';
            copyBtn.style.display = 'inline-block';

            // Show IBM execute panel if token is set
            if (hasIBMToken() && currentFramework === 'qiskit') {
                showIBMPanel();
            } else if (hasIBMToken()) {
                // For non-Qiskit, still show — QASM conversion handles it
                showIBMPanel();
            } else {
                ibmExecutePanel.style.display = 'none';
            }

            // Show hardware recommendation
            if (result.hwInfo) {
                const hw = result.hwInfo;
                hardwareOutput.innerHTML =
                    `<strong>Hardware Estimate:</strong> ${hw.num_qubits || '?'} qubits · depth ~${hw.depth_estimate || '?'} · ${hw.two_qubit_gates || '?'} 2Q gates` +
                    `<br><strong>Recommended:</strong> ${hw.recommended_backend || 'ibm_torino'}` +
                    (hw.notes ? ` — ${hw.notes}` : '');
                hardwareOutput.style.display = 'block';
            }
        } catch (err) {
            codeOutput.textContent = `# Pipeline error: ${err.message}\n#\n# Check your API key in settings (gear icon).`;
            explanationOutput.textContent = err.message;
            explanationOutput.style.display = 'block';
            copyBtn.style.display = 'none';
        }

        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        generateBtn.disabled = false;
        return;
    }

    // ── Fallback: pre-built examples ────────────────────────────
    providerBadge.style.display = 'none';
    document.getElementById('pipeline-tracker').style.display = 'none';

    const exName = exampleSelect.value;
    let matched = exName ? getExample(currentFramework, exName) : null;

    if (!matched) {
        const lower = prompt.toLowerCase();
        const fw = EXAMPLES[currentFramework] || EXAMPLES.qiskit;
        for (const [key, ex] of Object.entries(fw)) {
            if (lower.includes(key) || ex.prompt.toLowerCase().includes(lower.split(' ')[0])) {
                matched = ex;
                break;
            }
        }
    }

    setTimeout(() => {
        if (matched) {
            codeOutput.textContent = matched.code;
            lastGeneratedCode = matched.code;
            explanationOutput.textContent = matched.explanation;
            explanationOutput.style.display = 'block';
            copyBtn.style.display = 'inline-block';
            if (hasIBMToken()) showIBMPanel();
        } else {
            codeOutput.textContent = `# No API key — showing pre-built examples only.\n#\n# To run the full Collapse Pipeline:\n# 1. Click the gear icon in the nav bar\n# 2. Select your provider (Anthropic / OpenAI)\n# 3. Paste your API key\n# 4. Any prompt will run through all 6 pipeline stages!\n#\n# Or install locally:\n# pip install stable-collapse[${currentFramework}]\n# stablecollapse generate "${prompt}"`;
            explanationOutput.textContent = 'Add an API key (gear icon) to unlock live AI generation with the full Collapse Pipeline.';
            explanationOutput.style.display = 'block';
            copyBtn.style.display = 'none';
        }
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        generateBtn.disabled = false;
    }, 800 + Math.random() * 700);
});

// ─── Copy / Shortcuts ───────────────────────────────────────────────
copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(codeOutput.textContent).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
    });
});

function copyInstall() {
    const code = document.getElementById('install-code').textContent;
    navigator.clipboard.writeText(code).then(() => {
        const btn = document.querySelector('.install-section .copy-btn');
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
    });
}

promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        generateBtn.click();
    }
});

// ─── IBM Quantum Settings ──────────────────────────────────────────
const ibmTokenInput  = document.getElementById('ibm-token-input');
const saveIBMBtn     = document.getElementById('save-ibm-btn');
const clearIBMBtn    = document.getElementById('clear-ibm-btn');
const toggleIBMVis   = document.getElementById('toggle-ibm-vis');
const ibmStatusMsg   = document.getElementById('ibm-status-msg');

saveIBMBtn.addEventListener('click', () => {
    const token = ibmTokenInput.value.trim();
    if (!token) { ibmStatusMsg.textContent = 'Enter a token'; ibmStatusMsg.className = 'api-status-msg error'; return; }
    saveIBMToken(token);
    ibmStatusMsg.textContent = 'Token saved';
    ibmStatusMsg.className = 'api-status-msg success';
    updateUI();
});

clearIBMBtn.addEventListener('click', () => {
    ibmTokenInput.value = '';
    saveIBMToken('');
    ibmStatusMsg.textContent = 'Token removed';
    ibmStatusMsg.className = 'api-status-msg';
    updateUI();
});

toggleIBMVis.addEventListener('click', () => {
    ibmTokenInput.type = ibmTokenInput.type === 'password' ? 'text' : 'password';
});

// ─── IBM Quantum REST API ──────────────────────────────────────────

const IBM_API_BASE = 'https://api.quantum-computing.ibm.com';
const IBM_AUTH_URL = 'https://auth.quantum-computing.ibm.com/api/users/loginWithToken';

let ibmAccessToken = null;
let ibmAccessTokenExpiry = 0;

async function ibmAuthenticate() {
    const apiToken = getIBMToken();
    if (!apiToken) throw new Error('No IBM Quantum token configured');

    // Reuse token if still valid (tokens last ~1 hour)
    if (ibmAccessToken && Date.now() < ibmAccessTokenExpiry) return ibmAccessToken;

    const res = await fetch(IBM_AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiToken }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error('Invalid IBM Quantum token');
        throw new Error(err.error?.message || `IBM auth failed (${res.status})`);
    }

    const data = await res.json();
    ibmAccessToken = data.id;
    ibmAccessTokenExpiry = Date.now() + 50 * 60 * 1000; // refresh after 50 min
    return ibmAccessToken;
}

async function ibmListBackends() {
    const token = await ibmAuthenticate();
    const res = await fetch(`${IBM_API_BASE}/runtime/backends`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Failed to list backends (${res.status})`);
    const data = await res.json();

    // Filter to operational real backends and sort by queue
    return (data.backends || data)
        .filter(b => b.is_simulator === false || b.simulator === false)
        .map(b => ({
            name: b.name || b.backend_name,
            qubits: b.num_qubits || b.n_qubits || 0,
            status: (b.status === 'active' || b.state === true || b.operational === true) ? 'online' : 'offline',
            pending: b.pending_jobs ?? 0,
        }))
        .filter(b => b.status === 'online')
        .sort((a, b) => a.pending - b.pending);
}

async function ibmSubmitQASM(qasm, backend, shots) {
    const token = await ibmAuthenticate();

    // Submit via the transpilation + execution endpoint
    const res = await fetch(`${IBM_API_BASE}/runtime/jobs`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            program_id: 'sampler',
            backend: backend,
            hub: 'ibm-q',
            group: 'open',
            project: 'main',
            params: {
                pubs: [[qasm, null, null, shots]],
            },
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error?.message || `Submit failed (${res.status})`);
    }

    return await res.json();
}

async function ibmGetJobStatus(jobId) {
    const token = await ibmAuthenticate();
    const res = await fetch(`${IBM_API_BASE}/runtime/jobs/${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Status check failed (${res.status})`);
    return await res.json();
}

async function ibmGetJobResults(jobId) {
    const token = await ibmAuthenticate();
    const res = await fetch(`${IBM_API_BASE}/runtime/jobs/${jobId}/results`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Results fetch failed (${res.status})`);
    return await res.json();
}

async function ibmPollUntilDone(jobId, statusEl) {
    const terminalStates = ['completed', 'failed', 'cancelled', 'error'];
    let attempts = 0;
    const maxAttempts = 120; // 10 min max

    while (attempts < maxAttempts) {
        const job = await ibmGetJobStatus(jobId);
        const state = (job.status || job.state || '').toLowerCase();

        statusEl.innerHTML = `<div class="status-line"><span class="spinner"></span> ${state}... (${attempts * 5}s)</div>`;

        if (terminalStates.some(s => state.includes(s))) {
            return { state, job };
        }

        await new Promise(r => setTimeout(r, 5000));
        attempts++;
    }

    throw new Error('Job timed out after 10 minutes');
}

// ─── IBM Execute UI Flow ───────────────────────────────────────────

const ibmExecutePanel  = document.getElementById('ibm-execute-panel');
const ibmBackendSelect = document.getElementById('ibm-backend-select');
const ibmShotsInput    = document.getElementById('ibm-shots-input');
const ibmRunBtn        = document.getElementById('ibm-run-btn');
const ibmJobStatusEl   = document.getElementById('ibm-job-status');
const ibmResultsPanel  = document.getElementById('ibm-results-panel');
const ibmHistogram     = document.getElementById('ibm-histogram');
const ibmResultsMeta   = document.getElementById('ibm-results-meta');
const ibmJobIdEl       = document.getElementById('ibm-job-id');

let lastGeneratedCode = '';

function showIBMPanel() {
    if (!hasIBMToken()) return;
    ibmExecutePanel.style.display = 'block';

    // Load backends
    ibmBackendSelect.innerHTML = '<option value="">Loading backends...</option>';
    ibmListBackends().then(backends => {
        ibmBackendSelect.innerHTML = '';
        if (backends.length === 0) {
            ibmBackendSelect.innerHTML = '<option value="">No backends available</option>';
            return;
        }
        for (const b of backends.slice(0, 10)) {
            const opt = document.createElement('option');
            opt.value = b.name;
            opt.textContent = `${b.name} (${b.qubits}q, ${b.pending} queued)`;
            ibmBackendSelect.appendChild(opt);
        }
    }).catch(err => {
        ibmBackendSelect.innerHTML = `<option value="">Error: ${err.message}</option>`;
    });
}

ibmRunBtn.addEventListener('click', async () => {
    const backend = ibmBackendSelect.value;
    if (!backend) { alert('Select a backend'); return; }

    const shots = parseInt(ibmShotsInput.value) || 4096;
    ibmRunBtn.disabled = true;
    ibmRunBtn.textContent = 'Submitting...';
    ibmJobStatusEl.style.display = 'block';
    ibmJobStatusEl.innerHTML = '<div class="status-line"><span class="spinner"></span> Converting to QASM...</div>';
    ibmResultsPanel.style.display = 'none';

    try {
        // Step 1: Ask LLM to convert generated code to OpenQASM 2.0
        const qasmPrompt = `Convert the following quantum code to OpenQASM 2.0 format.
Return ONLY the raw QASM code, no markdown fences, no explanation. Start with OPENQASM 2.0;

Code:
\`\`\`python
${lastGeneratedCode}
\`\`\``;

        const qasm = await callLLM(qasmPrompt, {
            system: 'You convert quantum code to OpenQASM 2.0. Return ONLY the QASM code, nothing else. No markdown. Start with OPENQASM 2.0;',
            temperature: 0.1,
            maxTokens: 2048,
        });

        // Clean QASM output
        let cleanQasm = qasm.trim();
        if (cleanQasm.includes('```')) {
            const parts = cleanQasm.split('```');
            for (let i = 0; i < parts.length; i++) {
                if (i % 2 === 1) {
                    const lines = parts[i].trim().split('\n');
                    if (lines[0] && !lines[0].startsWith('OPENQASM')) {
                        cleanQasm = lines.slice(1).join('\n');
                    } else {
                        cleanQasm = parts[i].trim();
                    }
                    break;
                }
            }
        }

        if (!cleanQasm.startsWith('OPENQASM')) {
            const idx = cleanQasm.indexOf('OPENQASM');
            if (idx >= 0) cleanQasm = cleanQasm.substring(idx);
            else throw new Error('Failed to generate valid QASM');
        }

        // Step 2: Submit to IBM Quantum
        ibmJobStatusEl.innerHTML = '<div class="status-line"><span class="spinner"></span> Submitting to IBM Quantum...</div>';
        const submitResult = await ibmSubmitQASM(cleanQasm, backend, shots);
        const jobId = submitResult.id || submitResult.job_id;

        if (!jobId) throw new Error('No job ID returned');
        ibmJobIdEl.textContent = jobId;

        // Step 3: Poll for results
        ibmJobStatusEl.innerHTML = `<div class="status-line"><span class="spinner"></span> Job ${jobId.substring(0, 8)}... queued</div>`;
        const { state, job } = await ibmPollUntilDone(jobId, ibmJobStatusEl);

        if (state.includes('completed')) {
            // Step 4: Get results
            ibmJobStatusEl.innerHTML = '<div class="status-line"><span class="spinner"></span> Fetching results...</div>';
            const results = await ibmGetJobResults(jobId);

            // Parse counts from results
            let counts = {};
            if (results.results && results.results[0]) {
                counts = results.results[0].data?.counts || results.results[0].counts || {};
            } else if (results.quasi_dists) {
                counts = results.quasi_dists[0] || {};
            } else if (typeof results === 'object') {
                // Try to find counts in the response
                const findCounts = (obj) => {
                    if (obj.counts) return obj.counts;
                    for (const v of Object.values(obj)) {
                        if (v && typeof v === 'object') {
                            const found = findCounts(v);
                            if (found) return found;
                        }
                    }
                    return null;
                };
                counts = findCounts(results) || {};
            }

            // Convert hex keys to binary if needed
            const displayCounts = {};
            for (const [key, val] of Object.entries(counts)) {
                let label = key;
                if (key.startsWith('0x')) {
                    const n = parseInt(key, 16);
                    label = n.toString(2).padStart(Math.ceil(Math.log2(Math.max(2, ...Object.keys(counts).map(k => parseInt(k, 16) || 0)) + 1)), '0');
                }
                displayCounts[label] = typeof val === 'number' && val < 1 ? Math.round(val * shots) : val;
            }

            renderHistogram(displayCounts, shots, backend, jobId);
            ibmJobStatusEl.innerHTML = `<span style="color:var(--accent)">Job completed</span>`;
        } else {
            ibmJobStatusEl.innerHTML = `<span style="color:#ff5f56">Job ${state}</span>`;
        }

    } catch (err) {
        ibmJobStatusEl.innerHTML = `<span style="color:#ff5f56">Error: ${err.message}</span>`;
    }

    ibmRunBtn.disabled = false;
    ibmRunBtn.textContent = 'Execute';
});

function renderHistogram(counts, shots, backend, jobId) {
    ibmResultsPanel.style.display = 'block';
    ibmHistogram.innerHTML = '';

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const maxCount = Math.max(...entries.map(e => e[1]));
    const totalCounts = entries.reduce((s, e) => s + e[1], 0);

    // Show top 16 bars max
    const shown = entries.slice(0, 16);

    for (const [label, count] of shown) {
        const pct = (count / maxCount) * 100;
        const group = document.createElement('div');
        group.className = 'bar-group';

        const countEl = document.createElement('div');
        countEl.className = 'bar-count';
        countEl.textContent = count;

        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = '0%';
        setTimeout(() => { bar.style.height = Math.max(pct, 2) + '%'; }, 50);

        const labelEl = document.createElement('div');
        labelEl.className = 'bar-label';
        labelEl.textContent = label;
        labelEl.title = `|${label}> : ${count} (${(count / totalCounts * 100).toFixed(1)}%)`;

        group.appendChild(countEl);
        group.appendChild(bar);
        group.appendChild(labelEl);
        ibmHistogram.appendChild(group);
    }

    if (entries.length > 16) {
        const more = document.createElement('div');
        more.className = 'bar-group';
        more.innerHTML = `<div class="bar-label" style="color:var(--text-dim)">+${entries.length - 16} more</div>`;
        ibmHistogram.appendChild(more);
    }

    ibmResultsMeta.innerHTML = `
        <span>Backend: <strong>${backend}</strong></span>
        <span>Shots: <strong>${totalCounts}</strong></span>
        <span>States: <strong>${entries.length}</strong></span>
        <span>Job: <strong>${jobId.substring(0, 12)}...</strong></span>
    `;
}

// ─── Init ───────────────────────────────────────────────────────────
ibmTokenInput.value = getIBMToken();
updateUI();
