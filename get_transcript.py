# -*- coding: utf-8 -*-
import json
import sys
import io

# Windows에서 UTF-8 출력 강제
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def get_transcript(video_id):
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        
        # 인스턴스 생성
        ytt_api = YouTubeTranscriptApi()
        
        transcript = None
        
        # 한국어 먼저 시도
        try:
            transcript = ytt_api.fetch(video_id, languages=['ko'])
            print(f"Korean transcript found", file=sys.stderr)
        except Exception as e:
            print(f"Korean fetch failed: {e}", file=sys.stderr)
        
        # 영어 시도
        if not transcript:
            try:
                transcript = ytt_api.fetch(video_id, languages=['en'])
                print(f"English transcript found", file=sys.stderr)
            except Exception as e:
                print(f"English fetch failed: {e}", file=sys.stderr)
        
        # 아무 언어나 시도
        if not transcript:
            try:
                transcript = ytt_api.fetch(video_id)
                print(f"Default transcript found", file=sys.stderr)
            except Exception as e:
                print(f"Default fetch failed: {e}", file=sys.stderr)
                return {'success': False, 'error': str(e)}
        
        if transcript:
            # FetchedTranscript 객체 처리
            if hasattr(transcript, 'snippets'):
                text = ' '.join([seg.text for seg in transcript.snippets])
                return {'success': True, 'text': text, 'segments': len(transcript.snippets)}
            elif hasattr(transcript, '__iter__'):
                segments = list(transcript)
                if segments:
                    if hasattr(segments[0], 'text'):
                        text = ' '.join([seg.text for seg in segments])
                    else:
                        text = ' '.join([seg.get('text', str(seg)) for seg in segments])
                    return {'success': True, 'text': text, 'segments': len(segments)}
            
            # 다른 형태
            text = str(transcript)
            return {'success': True, 'text': text, 'segments': 1}
        else:
            return {'success': False, 'error': 'No transcript available'}
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {'success': False, 'error': str(e)}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'Video ID required'}))
    else:
        result = get_transcript(sys.argv[1])
        print(json.dumps(result, ensure_ascii=False))
