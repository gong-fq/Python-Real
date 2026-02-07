const axios = require('axios');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: "仅支持 POST 请求" }) };
    }

    try {
        const { message, lesson, history } = JSON.parse(event.body);
        const API_KEY = process.env.DEEPSEEK_API_KEY;

        if (!API_KEY) {
            return { statusCode: 500, body: JSON.stringify({ response: "服务器未配置 API Key，请在 Netlify 后台设置环境变量。" }) };
        }

        // 1. 结构化知识库上下文 (根据课程号匹配)
        const knowledgeBase = {
            1: "第一讲：Python环境搭建，涉及Python下载、环境变量、Hello World。",
            2: "第二讲：变量与基本运算，涉及int, float, string类型及基础数学运算。",
            // ... 可以根据需要扩展更多结构化背景
        };

        const lessonContext = knowledgeBase[lesson] || "通用Python编程知识";

        // 2. 构建对话上下文（包含历史记录实现连贯性）
        const messages = [
            { 
                role: "system", 
                content: `你是一个专业的Python助教。
                意图识别：请自动识别用户是询问【概念解释】、【代码示例】还是【环境配置】并相应调整语气。
                知识匹配：请优先参考此背景知识：${lessonContext}。
                要求：回答简洁、专业，代码示例请使用 Markdown 格式。`
            },
            ...history, // 历史对话
            { role: "user", content: message }
        ];

        // 3. 调用 DeepSeek API
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: "deepseek-chat",
            messages: messages,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 增加超时时间
        });

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                response: response.data.choices[0].message.content,
                history: [...history, { role: "user", content: message }, { role: "assistant", content: response.data.choices[0].message.content }]
            })
        };

    } catch (error) {
        console.error('API Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ response: "抱歉，由于 API 连接波动，我暂时无法回答。请检查网络或 Key 余额。" })
        };
    }
};