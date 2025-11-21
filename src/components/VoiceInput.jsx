import React, { useState, useEffect, useRef } from 'react';

const VoiceInput = ({ onTranscriptComplete }) => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [browserSupported, setBrowserSupported] = useState(true);
  const [recognitionType, setRecognitionType] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Try multiple speech recognition APIs with fallbacks
    const initSpeechRecognition = () => {
      // Primary: Chrome/Edge desktop (webkitSpeechRecognition)
      if (window.webkitSpeechRecognition) {
        console.log('Using webkitSpeechRecognition (Chrome/Edge)');
        const recognitionInstance = new window.webkitSpeechRecognition();
        setupRecognition(recognitionInstance, 'webkit');
        setRecognitionType('WebKit Speech API');
        return;
      }
      
      // Secondary: Standard Speech Recognition API
      if (window.SpeechRecognition) {
        console.log('Using SpeechRecognition (Standard)');
        const recognitionInstance = new window.SpeechRecognition();
        setupRecognition(recognitionInstance, 'standard');
        setRecognitionType('Standard Speech API');
        return;
      }

      // Tertiary: Mobile/iOS Safari
      if (window.webkitSpeechRecognition || navigator.mediaDevices) {
        console.log('Attempting mobile speech recognition');
        tryMobileSpeechRecognition();
        return;
      }

      // No support found
      console.error('No speech recognition support found');
      setBrowserSupported(false);
    };

    const setupRecognition = (recognitionInstance, type) => {
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      recognitionInstance.maxAlternatives = 1;

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
        } else if (event.error === 'aborted') {
          console.log('Recognition aborted');
        } else {
          setListening(false);
        }
      };

      recognitionInstance.onend = () => {
        console.log('Speech recognition ended');
        if (listening && recognitionRef.current) {
          // Restart if still in listening mode (for continuous listening)
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

    const tryMobileSpeechRecognition = () => {
      // For mobile devices, use a simpler approach
      if ('webkitSpeechRecognition' in window) {
        const recognitionInstance = new window.webkitSpeechRecognition();
        recognitionInstance.continuous = false; // Mobile works better with non-continuous
        recognitionInstance.interimResults = true;
        setupRecognition(recognitionInstance, 'mobile');
        setRecognitionType('Mobile Speech API');
      } else {
        setBrowserSupported(false);
      }
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
    };
  }, []);

  const startListening = () => {
    if (recognition) {
      setTranscript('');
      setFinalTranscript('');
      setListening(true);
      try {
        recognition.start();
        console.log('Started listening');
      } catch (error) {
        console.error('Error starting recognition:', error);
        // If already started, stop and restart
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
    
    // Get the complete text - use finalTranscript OR transcript
    const textToProcess = finalTranscript.trim() || transcript.trim();
    console.log('Text to send to parent:', textToProcess);
    
    if (textToProcess && onTranscriptComplete) {
      console.log('Calling onTranscriptComplete with:', textToProcess);
      // Call with single parameter - the transcribed text
      onTranscriptComplete(textToProcess);
      
      // Clear after a brief delay
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
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3" role="alert">
        <i className="bi bi-exclamation-triangle-fill text-amber-600 text-xl mt-0.5"></i>
        <div>
          <strong className="text-amber-900">Browser not supported!</strong>
          <p className="text-sm text-amber-800 mt-1">Please use Chrome, Edge, or Safari for voice input.</p>
          <small className="text-amber-700">Platform: {navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}</small>
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
            <small className="text-muted-foreground text-xs">
              {recognitionType}
            </small>
          )}
          {listening && (
            <div className="text-foreground mt-2 font-medium">
              <i className="bi bi-mic-fill text-red-500 animate-pulse"></i> Listening... Click to stop
            </div>
          )}
        </div>
      </div>

      {(transcript || finalTranscript) && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h6 className="text-sm font-semibold mb-2 text-blue-900 flex items-center gap-2">
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
          <p className="text-blue-900">
            <strong>{finalTranscript}</strong>
            <span className="text-blue-700">{transcript}</span>
          </p>
          {listening && (
            <small className="text-blue-600 mt-2 block">
              <i className="bi bi-info-circle"></i> Keep speaking or click stop when done...
            </small>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceInput;
