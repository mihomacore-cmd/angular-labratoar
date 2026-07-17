import { Component, ElementRef, ViewChild } from '@angular/core';
import { ChatService } from './chat.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrls: ['./chatbot.scss']
})
export class ChatbotComponent {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  isOpen = false;
  messages: { sender: 'user' | 'bot'; text: string }[] = [];
  newMessage = '';
  loading = false;

  constructor(private chatService: ChatService) {
    // پیام خوش‌آمدگویی (اختیاری)
    this.messages.push({
      sender: 'bot',
      text: 'سلام! من دستیار تخصصی لابراتوار پروتزهای دندانی هستم. چه سوالی دارید؟'
    });
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.scrollToBottom();
    }
  }

  closeChat() {
    this.isOpen = false;
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;

    const userMsg = this.newMessage.trim();
    this.messages.push({ sender: 'user', text: userMsg });
    this.newMessage = '';
    this.loading = true;
    this.scrollToBottom();

    this.chatService.sendMessage(userMsg).subscribe({
      next: (response) => {
        this.loading = false;
        // استخراج پاسخ از ساختار Groq
        let botReply = 'پاسخی دریافت نشد.';
        if (response?.choices?.length > 0) {
          botReply = response.choices[0].message.content.trim();
        } else if (response?.reply) {
          botReply = response.reply;
        }
        this.messages.push({ sender: 'bot', text: botReply });
        this.scrollToBottom();
      },
      error: (err) => {
        this.loading = false;
        console.error('❌ خطا در ارسال پیام:', err);
        this.messages.push({
          sender: 'bot',
          text: `⚠️ ${err.message || 'متأسفانه خطایی رخ داد. لطفاً مجدداً تلاش کنید.'}`
        });
        this.scrollToBottom();
      }
    });
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messageContainer) {
        this.messageContainer.nativeElement.scrollTop =
          this.messageContainer.nativeElement.scrollHeight;
      }
    }, 150);
  }
}