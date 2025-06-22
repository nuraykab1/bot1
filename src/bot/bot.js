import TelegramBot from 'node-telegram-bot-api';
import { StudentService } from '../services/studentService.js';
import { CourseService } from '../services/courseService.js';
import { PaymentService } from '../services/paymentService.js';
import { logActivity } from '../services/crmService.js';
import { texts } from './texts.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

export const bot = new TelegramBot(token, { polling: true });

// User sessions storage
const userSessions = new Map();

// Session states
const STATES = {
  LANGUAGE_SELECTION: 'language_selection',
  MAIN_MENU: 'main_menu',
  REGISTRATION_NAME: 'registration_name',
  REGISTRATION_AGE: 'registration_age',
  REGISTRATION_PHONE: 'registration_phone',
  COURSE_SELECTION: 'course_selection',
  PAYMENT_PROCESSING: 'payment_processing'
};

// Initialize user session
function initSession(chatId) {
  if (!userSessions.has(chatId)) {
    userSessions.set(chatId, {
      state: STATES.LANGUAGE_SELECTION,
      language: 'ru',
      registrationData: {}
    });
  }
  return userSessions.get(chatId);
}

// Language selection keyboard
const languageKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [{ text: 'Русский', callback_data: 'lang_ru' }],
      [{ text: 'Қазақша', callback_data: 'lang_kz' }]
    ]
  }
};

// Main menu keyboard
function getMainMenuKeyboard(language) {
  const t = texts[language];
  return {
    reply_markup: {
      keyboard: [
        [{ text: t.menu[0] }], // Register
        [{ text: t.menu[1] }], // Courses
        [{ text: t.menu[2] }], // FAQ
        [{ text: '💳 Мои курсы / Менің курстарым' }]
      ],
      resize_keyboard: true
    }
  };
}

// Course selection keyboard
async function getCourseKeyboard() {
  const result = await CourseService.getActiveCourses();
  if (!result.success) return null;

  const keyboard = result.courses.map(course => [{ text: course.name }]);
  keyboard.push([{ text: '🔙 Назад / Артқа' }]);

  return {
    reply_markup: {
      keyboard,
      resize_keyboard: true
    }
  };
}

// Start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const session = initSession(chatId);
  
  await bot.sendMessage(chatId, '🌐 Выберите язык / Тілді таңдаңыз:', languageKeyboard);
});

// Language selection
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const session = initSession(chatId);

  if (data.startsWith('lang_')) {
    const language = data.split('_')[1];
    session.language = language;
    session.state = STATES.MAIN_MENU;
    
    const t = texts[language];
    await bot.sendMessage(chatId, t.start, getMainMenuKeyboard(language));
    await bot.answerCallbackQuery(callbackQuery.id);
  }
});

// Message handler
bot.on('message', async (msg) => {
  if (msg.text?.startsWith('/')) return; // Skip commands

  const chatId = msg.chat.id;
  const session = initSession(chatId);
  const t = texts[session.language];
  const messageText = msg.text?.trim();

  try {
    switch (session.state) {
      case STATES.MAIN_MENU:
        await handleMainMenu(chatId, messageText, session, t);
        break;

      case STATES.REGISTRATION_NAME:
        session.registrationData.name = messageText;
        session.state = STATES.REGISTRATION_AGE;
        await bot.sendMessage(chatId, t.ask_age);
        break;

      case STATES.REGISTRATION_AGE:
        const age = parseInt(messageText);
        if (isNaN(age) || age < 5 || age > 18) {
          await bot.sendMessage(chatId, '❗ Пожалуйста, введите корректный возраст (5-18 лет)');
          return;
        }
        session.registrationData.age = age;
        session.state = STATES.REGISTRATION_PHONE;
        await bot.sendMessage(chatId, t.ask_phone);
        break;

      case STATES.REGISTRATION_PHONE:
        session.registrationData.phone = messageText;
        session.state = STATES.COURSE_SELECTION;
        const courseKeyboard = await getCourseKeyboard();
        await bot.sendMessage(chatId, t.ask_course, courseKeyboard);
        break;

      case STATES.COURSE_SELECTION:
        await handleCourseSelection(chatId, messageText, session, t);
        break;

      default:
        await bot.sendMessage(chatId, '❗ Пожалуйста, выберите пункт из меню.');
    }
  } catch (error) {
    console.error('Bot message handler error:', error);
    await bot.sendMessage(chatId, '❗ Произошла ошибка. Попробуйте позже.');
  }
});

// Handle main menu
async function handleMainMenu(chatId, messageText, session, t) {
  if (messageText === t.menu[0]) { // Register
    session.state = STATES.REGISTRATION_NAME;
    session.registrationData = {};
    await bot.sendMessage(chatId, t.ask_name);
    
  } else if (messageText === t.menu[1]) { // Courses
    const result = await CourseService.getActiveCourses();
    if (result.success) {
      let courseList = '📚 Доступные курсы:\n\n';
      result.courses.forEach(course => {
        courseList += `🔹 **${course.name}**\n`;
        courseList += `   ${course.description || 'Описание скоро появится'}\n`;
        courseList += `   💰 ${course.price.toLocaleString()} ₸/месяц\n`;
        courseList += `   ⏱ ${course.duration_weeks} недель\n\n`;
      });
      await bot.sendMessage(chatId, courseList, { parse_mode: 'Markdown' });
    }
    
  } else if (messageText === t.menu[2]) { // FAQ
    await bot.sendMessage(chatId, t.faq);
    
  } else if (messageText === '💳 Мои курсы / Менің курстарым') {
    await handleMyCourses(chatId, session);
  }
}

// Handle course selection
async function handleCourseSelection(chatId, messageText, session, t) {
  if (messageText === '🔙 Назад / Артқа') {
    session.state = STATES.MAIN_MENU;
    await bot.sendMessage(chatId, t.start, getMainMenuKeyboard(session.language));
    return;
  }

  // Get course details
  const courseResult = await CourseService.getCourseByName(messageText);
  if (!courseResult.success) {
    await bot.sendMessage(chatId, '❗ Выберите курс из списка.');
    return;
  }

  const course = courseResult.course;
  session.registrationData.course = course;

  // Create or update student
  const studentResult = await StudentService.upsertStudent(chatId, {
    name: session.registrationData.name,
    age: session.registrationData.age,
    phone: session.registrationData.phone,
    language: session.language
  });

  if (!studentResult.success) {
    await bot.sendMessage(chatId, '❗ Ошибка при сохранении данных. Попробуйте позже.');
    return;
  }

  const student = studentResult.student;

  // Create enrollment
  const enrollmentResult = await CourseService.createEnrollment(student.id, course.id);
  if (!enrollmentResult.success) {
    await bot.sendMessage(chatId, '❗ Ошибка при записи на курс. Попробуйте позже.');
    return;
  }

  const enrollment = enrollmentResult.enrollment;

  // Create payment
  const paymentResult = await PaymentService.createPayment(enrollment.id, course.price);
  if (!paymentResult.success) {
    await bot.sendMessage(chatId, '❗ Ошибка при создании платежа. Попробуйте позже.');
    return;
  }

  // Send payment link
  const paymentUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment?client_secret=${paymentResult.clientSecret}`;
  
  const paymentMessage = `✅ Заявка принята!\n\n` +
    `👤 Имя: ${student.name}\n` +
    `🎂 Возраст: ${student.age}\n` +
    `📱 Телефон: ${student.phone}\n` +
    `📚 Курс: ${course.name}\n` +
    `💰 Стоимость: ${course.price.toLocaleString()} ₸\n\n` +
    `💳 Для завершения записи оплатите курс по ссылке:\n${paymentUrl}\n\n` +
    `После оплаты мы свяжемся с вами для уточнения расписания.`;

  await bot.sendMessage(chatId, paymentMessage);

  // Reset session
  session.state = STATES.MAIN_MENU;
  session.registrationData = {};
}

// Handle my courses
async function handleMyCourses(chatId, session) {
  const studentResult = await StudentService.getStudentByTelegramId(chatId);
  if (!studentResult.success || !studentResult.student) {
    await bot.sendMessage(chatId, '❗ Вы еще не записаны ни на один курс.');
    return;
  }

  const enrollmentsResult = await CourseService.getStudentEnrollments(studentResult.student.id);
  if (!enrollmentsResult.success || enrollmentsResult.enrollments.length === 0) {
    await bot.sendMessage(chatId, '❗ У вас нет активных записей на курсы.');
    return;
  }

  let message = '📚 Ваши курсы:\n\n';
  enrollmentsResult.enrollments.forEach((enrollment, index) => {
    const statusEmoji = enrollment.status === 'confirmed' ? '✅' : 
                       enrollment.status === 'pending' ? '⏳' : '❌';
    const paymentEmoji = enrollment.payment_status === 'paid' ? '💳' : 
                        enrollment.payment_status === 'pending' ? '⏳' : '❌';
    
    message += `${index + 1}. ${statusEmoji} **${enrollment.courses.name}**\n`;
    message += `   Статус: ${getStatusText(enrollment.status, session.language)}\n`;
    message += `   Оплата: ${paymentEmoji} ${getPaymentStatusText(enrollment.payment_status, session.language)}\n`;
    message += `   Записан: ${new Date(enrollment.enrolled_at).toLocaleDateString()}\n\n`;
  });

  await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

// Helper functions
function getStatusText(status, language) {
  const statusTexts = {
    ru: {
      pending: 'Ожидает подтверждения',
      confirmed: 'Подтвержден',
      completed: 'Завершен',
      cancelled: 'Отменен'
    },
    kz: {
      pending: 'Растауды күтуде',
      confirmed: 'Расталды',
      completed: 'Аяқталды',
      cancelled: 'Болдырылмады'
    }
  };
  return statusTexts[language][status] || status;
}

function getPaymentStatusText(status, language) {
  const statusTexts = {
    ru: {
      pending: 'Ожидает оплаты',
      paid: 'Оплачено',
      failed: 'Ошибка оплаты',
      refunded: 'Возвращено'
    },
    kz: {
      pending: 'Төлемді күтуде',
      paid: 'Төленді',
      failed: 'Төлем қатесі',
      refunded: 'Қайтарылды'
    }
  };
  return statusTexts[language][status] || status;
}

console.log('🤖 Telegram bot initialized');