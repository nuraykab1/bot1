import asyncio
import logging
from aiogram import Bot, Dispatcher, F, Router
from aiogram.types import Message, ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import CommandStart
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.context import FSMContext

from config import BOT_TOKEN
from texts import texts  # Убедись, что этот файл есть

# Включаем логирование
logging.basicConfig(level=logging.INFO)

# Инициализация
bot = Bot(BOT_TOKEN)
dp = Dispatcher()
router = Router()
dp.include_router(router)

# Курсы
courses = ["Python", "LEGO WeDo", "MINDSTORMS", "Arduino"]

# Состояния
class Form(StatesGroup):
    name = State()
    age = State()
    course = State()
    phone = State()

# Кнопки выбора языка
lang_kb = InlineKeyboardMarkup(inline_keyboard=[
    [InlineKeyboardButton(text="Русский", callback_data="lang_ru")],
    [InlineKeyboardButton(text="Қазақша", callback_data="lang_kz")]
])

# Команда /start
@router.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext):
    await message.answer("🌐 Выберите язык / Тілді таңдаңыз:", reply_markup=lang_kb)

# Обработка выбора языка
@router.callback_query(F.data.startswith("lang_"))
async def set_lang(callback, state: FSMContext):
    lang = callback.data.split("_")[1]
    await state.update_data(lang=lang)
    t = texts[lang]

    kb = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text=t["menu"][0])],
            [KeyboardButton(text=t["menu"][1])],
            [KeyboardButton(text=t["menu"][2])]
        ],
        resize_keyboard=True
    )
    await callback.message.answer(t["start"], reply_markup=kb)
    await callback.answer()

# === FSM ХЕНДЛЕРЫ ===

@router.message(Form.name)
async def get_name(message: Message, state: FSMContext):
    await state.update_data(name=message.text)
    lang = (await state.get_data()).get("lang", "ru")
    await message.answer(texts[lang]["ask_age"])
    await state.set_state(Form.age)

@router.message(Form.age)
async def get_age(message: Message, state: FSMContext):
    await state.update_data(age=message.text)
    lang = (await state.get_data()).get("lang", "ru")
    kb = ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text=c)] for c in courses],
        resize_keyboard=True
    )
    await message.answer(texts[lang]["ask_course"], reply_markup=kb)
    await state.set_state(Form.course)

@router.message(Form.course)
async def get_course(message: Message, state: FSMContext):
    if message.text not in courses:
        await message.answer("❗ Выберите курс из списка.")
        return
    await state.update_data(course=message.text)
    lang = (await state.get_data()).get("lang", "ru")
    await message.answer(texts[lang]["ask_phone"])
    await state.set_state(Form.phone)

@router.message(Form.phone)
async def get_phone(message: Message, state: FSMContext):
    await state.update_data(phone=message.text)
    data = await state.get_data()
    lang = data.get("lang", "ru")
    await message.answer(texts[lang]["done"])

    # Сохраняем в файл
    with open("zayavki.txt", "a", encoding="utf-8") as file:
        file.write(f"Имя: {data['name']}\n")
        file.write(f"Возраст: {data['age']}\n")
        file.write(f"Курс: {data['course']}\n")
        file.write(f"Телефон: {data['phone']}\n")
        file.write("-" * 30 + "\n")

    print(f"\n📥 Заявка сохранена: {data}")
    await state.clear()

# === МЕНЮ ===

@router.message()
async def menu_handler(message: Message, state: FSMContext):
    data = await state.get_data()
    lang = data.get("lang", "ru")
    t = texts[lang]
    text = message.text.strip()

    if text == t["menu"][0]:  # 📝 Записаться
        await message.answer(t["ask_name"])
        await state.set_state(Form.name)

    elif text == t["menu"][1]:  # 📚 Курсы
        await message.answer("📚 Курстар:\n" + "\n".join(courses))

    elif text == t["menu"][2]:  # ❓ Вопросы
        await message.answer(t["faq"])

    else:
        await message.answer("❗ Пожалуйста, выберите пункт из меню.")

# === Запуск ===

async def main():
    print("✅ Бот запущен. Ожидает сообщений...")
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
