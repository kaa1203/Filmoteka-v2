const BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = "334986b59c344f376defb99ce94fed26";

// Fetch latest trending 
export async function fetchTrending(page) {
    const res = await fetch(`${BASE_URL}/trending/movie/day?api_key=${API_KEY}&page=${page}`);
    const data = await res.json();
    return data;
}

// Fetch search
export async function fetchSearchResult(search, page) {
    const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${search}&page=${page}&include_adult=false`);
    const data = await res.json();
    return data;
}

// debounce function
export function debounce(fn, duration) { //accepts function and the duration value
    let timer = null;   // set timer to null
    return function (...args) { //accepts the event and data (?)
        if (timer) { // if timer is not null
            clearInterval(timer); // clear timer
            timer = null; // set it to null
        }
        timer = setTimeout(() => { //execute the callback(?)
            fn.apply(this, args); // trigger the callback function(?)/ the function that was enclosed with debounce, still didn't get this apply part
            timer = null; // set timer to null
        }, duration); // the second parameter of debounce
    }
}

// throttle
export function throttle(fn, duration) {
    let timer = null;
    return function (...args) {
        if (timer === null) { // if it's null do this
            timer = setTimeout(() => {
                fn.apply(this, args);
                timer = null;
            }, duration);
        }
    }
}
