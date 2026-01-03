import { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Code } from 'lucide-react';

export default function PlaygroundPage() {
  const [code, setCode] = useState('// Write your code here\nconsole.log("Hello, Pixel Coders!");');
  const [output, setOutput] = useState('');
  const [language, setLanguage] = useState('javascript');
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const runCode = () => {
    setOutput('');
    const logs = [];
    
    const originalLog = console.log;
    console.log = (...args) => {
      logs.push(args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '));
    };

    try {
      // eslint-disable-next-line
      eval(code);
      setOutput(logs.join('\n') || 'Code executed successfully (no output)');
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      console.log = originalLog;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="border-b-4 border-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-white font-['Press_Start_2P'] text-2xl md:text-3xl mb-2" data-testid="playground-heading">
                Code Playground
              </h1>
              <p className="text-white font-['VT323'] text-xl">Write, run, and experiment with code</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="pixel-input py-2 px-4"
                data-testid="language-select"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
              </select>
              <button
                onClick={runCode}
                className="pixel-button flex items-center gap-2"
                data-testid="run-code-btn"
              >
                <Play className="w-4 h-4" />
                Run
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-200px)]">
        <div className="border-b-4 lg:border-b-0 lg:border-r-4 border-white" data-testid="code-editor">
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={(value) => setCode(value || '')}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              fontSize: 16,
              fontFamily: "'Space Mono', monospace",
              minimap: { enabled: false },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
            }}
          />
        </div>

        <div className="bg-[#0a0a0a] p-6" data-testid="code-output">
          <div className="flex items-center gap-2 mb-4 border-b-2 border-white pb-2">
            <Code className="text-white w-5 h-5" />
            <h2 className="text-white font-['Press_Start_2P'] text-sm">Output</h2>
          </div>
          <pre className="text-white font-['Space_Mono'] text-sm whitespace-pre-wrap">
            {output || 'Run your code to see output here'}
          </pre>
        </div>
      </div>

      <div className="border-t-4 border-white p-4 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <p className="text-white font-['VT323'] text-sm text-center">
            ⚠️ Note: This playground runs JavaScript in your browser. Python, HTML, and CSS are syntax-highlighted only.
          </p>
        </div>
      </div>
    </div>
  );
}