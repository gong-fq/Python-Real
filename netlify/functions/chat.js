const axios = require('axios');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Only POST allowed' };

    try {
        const { message, lesson, history } = JSON.parse(event.body);
        const API_KEY = process.env.DEEPSEEK_API_KEY;

        const systemPrompt = `你是一个专业的Python助教。
        当前用户正在学习天津财经大学统计学院龚凤乾教授的Python课程，当前为第${lesson}讲。
        1. 意图识别：自动判断用户是在问代码、求解释还是环境问题。
        2. 上下文感知：参考之前的对话历史：${JSON.stringify(history)}。
        3. 语气：专业且富有鼓励性。`;

        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: "deepseek-chat",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ]
        }, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ response: response.data.choices[0].message.content })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ response: "AI 暂时断开连接，请检查后台环境变量配置。" }) };
    }
};