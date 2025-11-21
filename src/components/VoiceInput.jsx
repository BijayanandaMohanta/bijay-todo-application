import React, { useState, useEffect, useRef } from 'react';

const VoiceInput = ({ onTranscriptComplete }) => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [browserSupported, setBrowserSupported] = useState(true);
  const [recognitionType, setRecognitionType] = useState('');
  const [useServerFallback, setUseServerFallback] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    // Try Web Speech API first
    const initSpeechRecognition = () => {
      if (window.webkitSpeechRecognition) {
        console.log('Using webkitSpeechRecognition (Chrome/Edge)');
        const recognitionInstance = new window.webkitSpeechRecognition();
        setupRecognition(recognitionInstance, 'webkit');
        setRecognitionType('Web Speech API');
        return;
      }
      
      if (window.SpeechRecognition) {
        console.log('Using SpeechRecognition (Standard)');
        const recognitionInstance = new window.SpeechRecognition();
        setupRecognition(recognitionInstance, 'standard');
        setRecognitionType('Web Speech API');
        return;
      }

      // Fallback to audio recording for server-side processing
      console.log('Web Speech API not available, using audio recording fallback');
      setUseServerFallback(true);
      setRecognitionType('Server-side Processing');
    };

    const setupRecognition = (recognitionInstance, type) => {
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      recognitionInstance.maxAlternatives = 3; // Get multiple alternatives for better accuracy

      recognitionInstance.onstart = () => {
        console.log('Speech recognition started');
        setListening(true);
      };

      recognitionInstance.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          console.log('Transcript piece:', transcriptPiece, 'isFinal:', event.results[i].isFinal);
          
          if (event.results[i].isFinal) {
            final += transcriptPiece + ' ';
          } else {
            interim += transcriptPiece;
          }
        }

        if (final) {
          setFinalTranscript(prev => prev + final);
        }
        setTranscript(final + interim);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          console.log('No speech detected, continuing...');
        } else if (event.error === 'network' || event.error === 'not-allowed') {
          // Switch to server fallback if network issues or permissions
          console.log('Switching to server-side fallback due to:', event.error);
          setUseServerFallback(true);
          setListening(false);
        } else if (event.error === 'aborted') {
          console.log('Recognition aborted');
        } else {
          setListening(false);
        }
      };

      recognitionInstance.onend = () => {
        console.log('Speech recognition ended');
        if (listening && recognitionRef.current) {
          try {
            recognitionInstance.start();
          } catch (e) {
            console.log('Could not restart recognition:', e);
            setListening(false);
          }
        } else {
          setListening(false);
        }
      };

      setRecognition(recognitionInstance);
      recognitionRef.current = recognitionInstance;
    };

    initSpeechRecognition();

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Cleanup error:', e);
        }
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000, // Optimal for speech recognition
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudioWithServer(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setListening(true);
      console.log('Audio recording started');
    } catch (error) {
      console.error('Error starting audio recording:', error);
      setBrowserSupported(false);
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setListening(false);
      console.log('Audio recording stopped');
    }
  };

  const processAudioWithServer = async (audioBlob) => {
    try {
      // Here you would send to your backend for processing with:
      // - Google Cloud Speech-to-Text
      // - OpenAI Whisper API
      // - Mozilla DeepSpeech (self-hosted)
      
      console.log('Processing audio with server...', audioBlob.size, 'bytes');
      setTranscript('Processing audio...');
      
      // For now, show a message that server processing would happen
      // In production, implement the actual API call
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      // Example API call (implement this endpoint in your backend):
      // const response = await fetch('/api/transcribe', {
      //   method: 'POST',
      //   body: formData
      // });
      // const data = await response.json();
      // const text = data.transcript;
      
      // For demo purposes:
      setTimeout(() => {
        const demoText = 'Server-side transcription would process this audio';
        setFinalTranscript(demoText);
        setTranscript(demoText);
        if (onTranscriptComplete) {
          onTranscriptComplete(demoText);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error processing audio:', error);
      setTranscript('Error processing audio. Please try again.');
    }
  };

  const startListening = () => {
    if (useServerFallback) {
      startAudioRecording();
    } else if (recognition) {
      setTranscript('');
      setFinalTranscript('');
      setListening(true);
      try {
        recognition.start();
        console.log('Started listening');
      } catch (error) {
        console.error('Error starting recognition:', error);
        try {
          recognition.stop();
          setTimeout(() => {
            recognition.start();
          }, 100);
        } catch (e) {
          console.error('Could not restart:', e);
        }
      }
    }
  };

  const stopListening = async () => {
    console.log('=== STOP LISTENING CALLED ===');
    
    if (useServerFallback) {
      stopAudioRecording();
      return;
    }
    
    console.log('finalTranscript:', finalTranscript);
    console.log('transcript:', transcript);
    
    if (recognition) {
      try {
        recognition.stop();
        recognitionRef.current = null;
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
      setListening(false);
    }
    
    const textToProcess = finalTranscript.trim() || transcript.trim();
    console.log('Text to send to parent:', textToProcess);
    
    if (textToProcess && onTranscriptComplete) {
      console.log('Calling onTranscriptComplete with:', textToProcess);
      onTranscriptComplete(textToProcess);
      
      setTimeout(() => {
        setTranscript('');
        setFinalTranscript('');
      }, 500);
    } else {
      console.log('No text to process or no callback');
      setTranscript('');
      setFinalTranscript('');
    }
  };

  if (!browserSupported) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3" role="alert">
        <i className="bi bi-exclamation-triangle-fill text-amber-600 dark:text-amber-400 text-xl mt-0.5"></i>
        <div>
          <strong className="text-amber-900 dark:text-amber-100">Microphone not available!</strong>
          <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">Please allow microphone access or use Chrome/Edge/Safari.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="voice-input-container">
      <div className="text-center">
        <button
          type="button"
          className={`w-20 h-20 rounded-full transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center text-white shadow-lg ${
            listening 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-primary hover:bg-primary/90'
          }`}
          onClick={listening ? stopListening : startListening}
        >
          {listening ? (
            <i className="bi bi-stop-fill text-3xl"></i>
          ) : (
            <i className="bi bi-mic-fill text-3xl"></i>
          )}
        </button>
        
        <div className="mt-3">
          {recognitionType && (
            <small className="text-muted-foreground text-xs block">
              {recognitionType}
              {useServerFallback && (
                <span className="block text-xs mt-1">
                  <i className="bi bi-cloud-arrow-up"></i> Server Processing
                </span>
              )}
            </small>
          )}
          {listening && (
            <div className="text-foreground mt-2 font-medium">
              <i className="bi bi-mic-fill text-red-500 animate-pulse"></i> 
              {useServerFallback ? 'Recording...' : 'Listening...'} Click to stop
            </div>
          )}
        </div>
      </div>

      {(transcript || finalTranscript) && (
        <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h6 className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-100 flex items-center gap-2">
            {listening ? (
              <>
                <i className="bi bi-mic-fill animate-pulse"></i>
                Live Transcription:
              </>
            ) : (
              <>
                <i className="bi bi-check-circle-fill"></i>
                Text captured - Check textarea below
              </>
            )}
          </h6>
          <p className="text-blue-900 dark:text-blue-100">
            <strong>{finalTranscript}</strong>
            <span className="text-blue-700 dark:text-blue-300">{transcript}</span>
          </p>
          {listening && (
            <small className="text-blue-600 dark:text-blue-400 mt-2 block">
              <i className="bi bi-info-circle"></i> Keep speaking or click stop when done...
            </small>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceInput;
