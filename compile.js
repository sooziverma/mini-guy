const fs = require('fs');
const path = require('path');
const solc = require('solc');

try {
    const contractPath = path.join(__dirname, 'MiniGuyGame.sol');
    const source = fs.readFileSync(contractPath, 'utf8');

    const input = {
        language: 'Solidity',
        sources: {
            'MiniGuyGame.sol': {
                content: source
            }
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['abi', 'evm.bytecode.object']
                }
            }
        }
    };

    console.log("Compiling contract...");
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors) {
        let hasError = false;
        output.errors.forEach(err => {
            console.error(err.formattedMessage);
            if (err.severity === 'error') hasError = true;
        });
        if (hasError) {
            process.exit(1);
        }
    }

    const contract = output.contracts['MiniGuyGame.sol']['MiniGuyGame'];
    const abi = contract.abi;
    const bytecode = contract.evm.bytecode.object;

    const result = {
        abi: abi,
        bytecode: bytecode
    };

    fs.writeFileSync(path.join(__dirname, 'compiled.json'), JSON.stringify(result, null, 2));
    console.log("Compilation successful! Saved to compiled.json");
} catch (e) {
    console.error("Compilation failed:", e.message);
    process.exit(1);
}
