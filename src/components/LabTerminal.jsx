import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import ApiService from '../network/API';

// Один xterm.js терминал, подключённый по WebSocket к одному контейнеру лабораторной
// работы. Использует реальный псевдотерминал на бэке (pty4j) — поддерживает vim/nano/htop.
const LabTerminal = ({ sessionId, env }) => {
    const containerRef = useRef(null);
    const termRef = useRef(null);
    const wsRef = useRef(null);

    useEffect(() => {
        const term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            theme: { background: '#1e1e1e' },
        });
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(containerRef.current);
        fitAddon.fit();
        termRef.current = term;

        const ws = new WebSocket(ApiService.getLabTerminalUrl(sessionId, env));
        ws.binaryType = 'arraybuffer';
        wsRef.current = ws;

        ws.onmessage = (event) => {
            const data = event.data instanceof ArrayBuffer
                ? new Uint8Array(event.data)
                : new TextEncoder().encode(event.data);
            term.write(data);
        };
        ws.onclose = () => term.write('\r\n\x1b[31m[соединение закрыто]\x1b[0m\r\n');
        ws.onerror = () => term.write('\r\n\x1b[31m[ошибка соединения]\x1b[0m\r\n');

        const onData = term.onData((data) => {
            if (ws.readyState === WebSocket.OPEN) ws.send(data);
        });

        const handleResize = () => fitAddon.fit();
        window.addEventListener('resize', handleResize);
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(containerRef.current);

        return () => {
            onData.dispose();
            window.removeEventListener('resize', handleResize);
            resizeObserver.disconnect();
            ws.close();
            term.dispose();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, env]);

    return (
        <Box
            ref={containerRef}
            sx={{
                width: '100%',
                height: '100%',
                backgroundColor: '#1e1e1e',
                borderRadius: 1,
                overflow: 'hidden',
                p: 1,
            }}
        />
    );
};

export default LabTerminal;
