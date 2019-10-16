import React, { useState, useCallback } from 'react';
import arrayBufferToBuffer from 'arraybuffer-to-buffer';
import RTPBuilder from './services/RTPBuilder';

const App = () => {

  const [microphoneAudioContext, setMicrophoneAudioContext] = useState(null);
  const [running, setRunning] = useState(false);
  const [srtBuffer, setStrBuffer] = useState("");
  const [state, setState] = useState({
    sampleRate: 8000,
    bufferSize: 160,
    capacity: 2046,
    channelCount: 1
  });

  const { bufferSize, capacity, sampleRate, channelCount } = state;

  const handleChange = useCallback(
    (event) => (key) => {
      const changes = { [key]: event.target.value };
      setState({ ...state, ...changes });
    },
    [state, setState],
  );

  const handleStart = useCallback(
    () => {
      const inputAudioContext = new AudioContext({ sampleRate });
      inputAudioContext.audioWorklet
      .addModule('worklet/microphone-worklet-processor.js')
      .then(() => {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then(stream => {
            const microphone = inputAudioContext.createMediaStreamSource(stream);
            const audioWorkletNode = new AudioWorkletNode(
              inputAudioContext,
              'microphone-worklet-processor',
              {
                channelCount,
                processorOptions: { //Passing the arguments to processor
                  bufferSize, //output buffer size
                  capacity // max fifo capacity
                },
              },
            );
  
            let rtpBuilder = null;
            audioWorkletNode.port.onmessage = ({ data }) => {
              if(data){
                  if(!rtpBuilder){
                    rtpBuilder = new RTPBuilder(data.length);
                    rtpBuilder.setPayloadType(8); //PCMA
                  }
                  const payload = arrayBufferToBuffer(new Uint8Array(data));
                  rtpBuilder.setPayload(payload);
                  const rtp = rtpBuilder.getPacket();
                  // this.ws.send(rtp, null, false)
                  console.log('RTP packet to send by websocket >> ', rtp);
                  setStrBuffer(JSON.stringify(rtp));
              }
            };
            microphone.connect(audioWorkletNode).connect(inputAudioContext.destination);
            setMicrophoneAudioContext(inputAudioContext);
            setStrBuffer("");
            setRunning(true);
          })
          .catch(e => {
            console.log(`AudioManager >> startMicrophoneCapture >>> GetUserMedia >> `, e);
            setRunning(false);
            setStrBuffer("");
          });
      })
      .catch(e => {
        console.log(`AudioManager >>> MicrophoneAudioContext >>> audioWorklet >> `, e);
        setRunning(false);
        setStrBuffer("");
      });
    },
    [setMicrophoneAudioContext, setRunning, bufferSize, capacity, channelCount, sampleRate],
  );

  const handleStop = useCallback(
    () => {
      if (microphoneAudioContext) {
        microphoneAudioContext.close();
        setMicrophoneAudioContext(null);
        setRunning(false);
        setStrBuffer("");
      }
    },
    [setMicrophoneAudioContext, microphoneAudioContext, setRunning],
  );
   
  return (
    <div className="app">
      <div className="settings">
         Output buffer size:<input type="text" value={bufferSize} onChange={handleChange('bufferSize')} />
         Max FIFO capacity:<input type="text" value={capacity} onChange={handleChange('capacity')} />
         Audio sample rate:<input type="text" value={sampleRate} onChange={handleChange('sampleRate')}/>
      </div>
      <>
		      {
            !running ? (<span className="icon microphone" title="Click to start capture" onClick={handleStart}></span>) : 
            (<><span className="icon microphone-rec" title="Click to stop capture" onClick={handleStop}></span>
            <span className="output">$>{srtBuffer}</span></>)
          }
      </> 
    </div>
  );
}

export default App;
