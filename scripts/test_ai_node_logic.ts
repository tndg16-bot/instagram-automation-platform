import aiNodeService from '../backend/src/services/nodes/aiNode';

async function testAINode() {
    console.log('🤖 Testing AI Node Logic...');

    const input = {
        promptTemplate: "Reply to {{username}}: Thank you for your comment!",
        variables: {
            username: "@test_user"
        }
    };

    try {
        const result = await aiNodeService.execute(input);

        console.log('---------- Input ----------');
        console.log('Template:', input.promptTemplate);
        console.log('Variables:', input.variables);

        console.log('---------- Output ----------');
        console.log('Used Prompt:', result.usedPrompt);
        console.log('Generated Text:', result.text);

        if (result.usedPrompt.includes('@test_user')) {
            console.log('✅ Template variable substitution working');
        } else {
            console.error('❌ Template variable substitution FAILED');
        }

        if (result.text && result.text.length > 0) {
            console.log('✅ AI Service integration working');
        } else {
            console.error('❌ AI Service returned empty text');
        }

    } catch (error) {
        console.error('❌ Test Error:', error);
    }
}

testAINode();
