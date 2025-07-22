// Replace with your deployed backend URL
const API_URL = 'https://railway.com/railway.schema.json/api/courses';

async function loadCourses() {
  try {
    const res = await fetch(API_URL, {
      credentials: 'include' // allow cookies/session
    });

    if (res.status === 401) {
      // Not logged in → redirect to login
      window.location.href = 'https://railway.com/railway.schema.json/login';
      return;
    }

    const data = await res.json();
    const container = document.getElementById('courses');
    container.innerHTML = '';

    data.forEach(course => {
      const div = document.createElement('div');
      div.className = 'course';
      div.innerHTML = `<strong>${course.name}</strong><br>${course.code}`;
      container.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    document.getElementById('courses').innerText = 'Failed to load courses.';
  }
}
