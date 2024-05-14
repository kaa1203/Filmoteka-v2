import { debounce, fetchTrending, fetchSearchResult, throttle } from "./exports.js";

let
   currentPage = 1,
   pageIndex = 1,
   maxPage,
   totalPages = 10;

const searchBarCon = document.querySelector(".nav-search"); 
const searchBarEl = document.querySelector(".nav-searchbar");
const navLinkEl = document.querySelectorAll(".nav-link");
const navLogoEl = document.querySelector(".nav-logo");
const navLibCon = document.querySelector(".nav-library");
const headerEl = document.querySelector("header");
const movieListEl = document.querySelector(".movie-list");
const pageListEl = document.querySelector(".page-list");
const loaderEl = document.querySelector(".loader");
const overlayEl = document.getElementsByClassName("overlay");
const statusMessage = document.createElement("li");
statusMessage.className = "center-text";

navLinkEl[0].addEventListener("click", navHome);
navLinkEl[1].addEventListener("click", navLib);
navLogoEl.addEventListener("click", navHome);
searchBarEl.addEventListener("input", debounce(onSearch, 1000));

function navHome() {
   if (navLinkEl[1].classList.contains("active")) {
      navLinkEl[1].classList.remove("active");
      navLinkEl[0].classList.add("active");
      searchBarCon.classList.remove("is-hidden");
      navLibCon.classList.add("is-hidden");
      navLibCon.children[0].classList.remove("selected");
      navLibCon.children[1].classList.remove("selected");
      headerEl.removeAttribute("class");
   }
   searchBarEl.value = "";
   currentPage = 1;
   displayMovies(currentPage);
}

function navLib() {
   if (navLinkEl[0].classList.contains("active")) {
      navLinkEl[0].classList.remove("active");
      navLinkEl[1].classList.add("active");
      searchBarCon.classList.add("is-hidden");
      navLibCon.classList.remove("is-hidden");
      headerEl.classList.add("library");
      navLibCon.children[0].classList.add("selected");
      currentPage = 1;
      displayMoviesFromLocalStorage("watchedList");
   }
   
}

navLibCon.addEventListener("click", (e) => {
   if (e.target.tagName === "BUTTON") {
      currentPage = 1;
      if (e.target.dataset.button === "watched") {
         e.target.classList.add("selected");
         displayMoviesFromLocalStorage("watchedList");
         e.target.nextElementSibling.classList.remove("selected");
      } else {
         e.target.classList.add("selected");
         displayMoviesFromLocalStorage("queueList");
         e.target.previousElementSibling.classList.remove("selected");
      }
   }
})


function onSearch() {
   let search = searchBarEl.value;
   currentPage = 1;
   
   if (search.trim() === "") { return }

   try {
      fetchSearchResult(search.trim(), currentPage).then(val => {
         loaderEl.classList.remove("is-hidden");
         movieListEl.innerHTML = "";      

         if (val.results.length != 0) {
            createMovieCards(val);
            pageListEl.classList.remove("is-hidden");  
         } else {
            loaderEl.classList.add("is-hidden");
            pageListEl.classList.add("is-hidden");
            statusMessage.textContent = `There are no movie titled "${search}" found.` ;
            movieListEl.appendChild(statusMessage);
         }
      })
   } catch (e) {
      console.log(e);
   }
}

function paginateSearch(search, page) {
   try {
      movieListEl.innerHTML = "";
      loaderEl.classList.remove("is-hidden");
      pageListEl.classList.add("is-hidden");

      fetchSearchResult(search.trim(), page).then(val => {
         createMovieCards(val);
         pageListEl.classList.remove("is-hidden");
      })
   } catch (e) {
      console.log(e);
   }
}

function displayMovies(page) {
   try {
      movieListEl.innerHTML = "";
      pageListEl.classList.add("is-hidden");

      fetchTrending(page).then(val => {
         createMovieCards(val);
         pageListEl.classList.remove("is-hidden");
      });
   } catch (e) {
      console.log(e)
   }
}

displayMovies(currentPage);

function displayMoviesFromLocalStorage(type, page) {
   page = currentPage;

   let movieList = JSON.parse(localStorage.getItem(type));
   let maximumPage = Math.ceil(movieList.length / 20);
   let initialSlice = (page - 1) * 20;
   let lastSlice = page * 20;
   
   movieList = movieList.reduce((array, movie, index) => {
      if (index >= initialSlice && index < lastSlice ) {
         array.push(movie);
      }
      return array;
   }, []);

   let movies = {
      page: currentPage,
      results: movieList,
      total_pages: maximumPage
   }
   
   movieListEl.innerHTML = "";
   
   if (movieList.length === 0) {
      pageListEl.classList.add("is-hidden");
      statusMessage.textContent = "No movies added to the list yet";
      movieListEl.appendChild(statusMessage);
      return;
   } 
   pageListEl.classList.remove("is-hidden");
   loaderEl.classList.remove("is-hidden"); 
   createMovieCards(movies);
}

function createMovieCards(movies) {
   const { results, total_pages, page } = movies;
   
   const movieItem = results.map(({
      id,
      title,
      genre_ids,
      vote_average,
      release_date,
      poster_path,
   }) => {
      let 
         imgSrc = `https://image.tmdb.org/t/p/w500/${poster_path}`,
         genres = getGenres(genre_ids);
      
      genre_ids.length === 0 ? genres = "N/A" : genres;

      release_date === ""
         ? release_date = "N/A"
         : release_date = new Date(release_date).getFullYear();
      
      poster_path === null
         ? imgSrc = "https://fakeimg.pl/300x450?text=Movie%20Image"
         : imgSrc;  

      return `
         <li class="movie-item" id="${id}">
            <a href="#" class="movie-link">
               <img src="${imgSrc}" alt="Movie Image" class="movie-image" loading="lazy">
               <div class="movie-details">
                  <h3 class="movie-title">${title}</h3>
                  <p class="movie-info">${genres} | ${release_date}  <span class="movie-rating">${vote_average.toFixed(1)}</span></p>
               </div>
            </a>
         </li>
      `;
   }).join("");    

   loaderEl.classList.add("is-hidden"); 
   movieListEl.insertAdjacentHTML("afterbegin", movieItem);
   totalPages = total_pages;

   createPagination(totalPages, page);

   const movieCards = document.querySelectorAll(".movie-link");

   movieCards.forEach(movieCard => {
      movieCard.addEventListener("click", (e) => {
         e.preventDefault();

         const liEl = e.currentTarget.parentElement;
         const overlay = document.createElement("div");
         overlay.className = "overlay";

         if (overlayEl.length <= 0) document.body.insertAdjacentElement("afterbegin", overlay);
         
         movies.results.forEach(movie => { 
            if (movie.id == liEl.id) {
               createModal(movie);
               isMovieOnList(movie.id);
               const buttonWrapper = document.querySelector(".movie-buttons");
               
               buttonWrapper.addEventListener("click", (e) => {
                  if (e.target.tagName === "BUTTON") {
                     if (e.target.dataset.button === "watched") {
                        if (e.target.innerText === "ADD TO WATCHED") {
                           addMovieToList(movie, "watchedList");
                           e.target.innerText = "remove from watched"; 
                           removeMovieFromList(movie.id, "queueList");
                           e.target.nextElementSibling.innerText = "add to queue";
                           e.target.classList.add("selected");
                        } else {
                              removeMovieFromList(movie.id, "watchedList");
                              e.target.innerText = "add to watched";
                              e.target.classList.remove("selected");
                        }
           
                        if (e.target.nextElementSibling.classList.contains("selected")) {
                              e.target.nextElementSibling.classList.remove("selected");
                        }
                     }

                     if (e.target.dataset.button === "queue") {
                        if (e.target.innerText === "ADD TO QUEUE") {
                            addMovieToList(movie, "queueList");
                            e.target.innerText = "remove from queue";
                            removeMovieFromList(movie.id, "watchedList");
                            e.target.previousElementSibling.innerText = "add to watched";
                            e.target.classList.add("selected");
                        } else {
                            removeMovieFromList(movie.id, "queueList");
                            e.target.innerText = "add to queue";
                            e.target.classList.remove("selected");
                        }
            
                        if (e.target.previousElementSibling.classList.contains("selected")) {
                            e.target.previousElementSibling.classList.remove("selected");
                        }
                    }
                  }
               });
            }
         });
      });
   });
}

function createModal(movie) {
   let { id, genre_ids, original_title, overview, popularity, poster_path, title, vote_average, vote_count } = movie;
   
   let 
      imgSrc = `https://image.tmdb.org/t/p/w500/${poster_path}`,
      genres = getGenres(genre_ids);
      
      genre_ids.length === 0 ? genres = "N/A" : genres;
      
      poster_path === null
         ? imgSrc = "https://fakeimg.pl/300x450?text=Movie%20Image"
      : imgSrc; 

      overview === "" ? overview = "N/A" : overview;
      
   let modal = `
      <div class="movie-modal" id="${id}">
         <div class="modal-close-wrapper"><span class="modal-close">&times;</span></div>
         <div class="modal-content">
            <div class="image-wrapper">
               <img src="${imgSrc}" alt="Movie Image">
            </div>
            <div class="movie-details-wrapper">
               <div class="movie-title">
                  <p>${title}</p>
               </div>
               <ul class="details-list">
                  <li class="details-item">
                     <p class="details-header">vote/votes</p>
                     <p class="details-content"><span class="movie-rating">${vote_average.toFixed(1)}</span> / ${vote_count}</p>
                  </li>
                  <li class="details-item">
                     <p class="details-header">popularity</p>
                     <span class="details-content">${popularity.toFixed(1)}</span>
                  </li>
                  <li class="details-item">
                     <p class="details-header">original title</p>
                     <span class="details-content">${original_title.toUpperCase()}</span>
                  </li>
                  <li class="details-item">
                     <p class="details-header">genre</p>
                     <span class="details-content">${genres}</span>
                  </li>
               </ul>
               <div class="movie-about">
                  <h4 class="about-header">about</h4>
                  <p>${overview}</p>
               </div>
               <div class="movie-buttons">
                  <button class="movie-button" data-button="watched">add to watched</button>
                  <button class="movie-button" data-button="queue">add to queue</button>
               </div>
            </div>
         </div>
      </div>
   `;

   overlayEl[0].insertAdjacentHTML("afterbegin", modal);
}

// I can fetched the data online but I can't print the value in cards so I was forced to do this manually, this shows how inexperience I am on handling promises. So to future me if you manage to solve this problem, cheers! you've come a long way 
function getGenres(genre_ids) {
   const genreArray = [
      { id: 28, name: "Action" },
      { id: 12, name: "Adventure" },
      { id: 16, name: "Animation" },
      { id: 35, name: "Comedy" },
      { id: 80, name: "Crime" },
      { id: 99, name: "Documentary" },
      { id: 18, name: "Drama" },
      { id: 10751, name: "Family" },
      { id: 14, name: "Fantasy" },
      { id: 36, name: "History" },
      { id: 27, name: "Horror" },
      { id: 10402, name: "Music" },
      { id: 9648, name: "Mystery" },
      { id: 10749, name: "Romance" },
      { id: 878, name: "Science Fiction" },
      { id: 10770, name: "TV Movie" },
      { id: 53, name: "Thriller" },
      { id: 10752, name: "War" },
      { id: 37, name: "Western" }
   ];

   return genreArray
      .filter(genre => genre_ids.includes(genre.id))
      .map(genre => genre.name)
      .join(", ");
}

// Pagination
function createPagination(totalPages, page) {
   pageListEl.innerHTML = "";
   
   let i = 1;
   maxPage = 10;
   
   pageIndex = currentPage % 10;

   if (currentPage % 10 === 1) {
    i = currentPage;
    maxPage = Math.min(currentPage + 9, totalPages);
  } else {
    i = Math.floor((currentPage - 1) / 10) * 10 + 1;
    maxPage = Math.min(i + 9, totalPages);
  }

   for (i; i <= maxPage; i++) {
      let pageEl = `
         <li class="page-item">
            <a href="javascript:void(0);" class="page-link" data-button="${i}">${i}</a>
         </li>
      `;

      pageListEl.insertAdjacentHTML("beforeend", pageEl);
   }

   let prevEl = `
   <li class="page-item">
      <a href="javascript:void(0);" class="page-link" data-button="prev">
         &#10140;
      </a>
   </li>`;

   pageListEl.insertAdjacentHTML("afterbegin", prevEl);

   let nextEl = `
   <li class="page-item">
      <a href="javascript:void(0);" class="page-link" data-button="next">
        &#10140;
      </a>
   </li>`;

   pageListEl.insertAdjacentHTML("beforeend", nextEl);

   const pages = document.querySelectorAll(".page-item");
   const nextButtonIndex = pages.length - 1;
   const lastPageIndex = pages.length - 2;

   if (page === totalPages) {
      pages[nextButtonIndex].classList.add("disabled");
      pages[nextButtonIndex].children[0].classList.add("no-click");
   }

   if (currentPage % 10 === 0) {
      return pages[lastPageIndex].classList.add("current")
   }

   if (page === 1) {
      pages[0].classList.add("disabled");
      pages[0].children[0].classList.add("no-click");
   }

   pages[pageIndex].classList.add("current");
}

document.addEventListener("click", debounce(pageClick, 500));

function pageClick(e) {
   if (e.target.classList.contains("page-link")) {
      e.preventDefault();
      let selectedButton = document.querySelector(".nav-button.selected");
      let button = e.target.dataset.button;
      
      loaderEl.classList.remove("is-hidden");

      if (button === "prev") {
         if(selectedButton) {
            displayMoviesFromLocalStorage(selectedButton.dataset.button+"List", currentPage -= 1);
            return;
         }

         if (searchBarEl.value != "") {
            paginateSearch(searchBarEl.value, currentPage -= 1);
            return;
         }

         currentPage -= 1;
      } else if (button === "next") {
         if(selectedButton) {
            displayMoviesFromLocalStorage(selectedButton.dataset.button+"List", currentPage += 1);
            return;
         }

         if (searchBarEl.value != "") {
            paginateSearch(searchBarEl.value, currentPage += 1);
            return;
         }

         currentPage += 1;
      } else {
         if(selectedButton) {
            displayMoviesFromLocalStorage(selectedButton.dataset.button+"List", currentPage = Number(e.target.dataset.button));
            return;
         }

         if (searchBarEl.value != "") {
            paginateSearch(searchBarEl.value, currentPage = Number(e.target.dataset.button));
            return;
         }

         if(selectedButton) {
            displayMoviesFromLocalStorage(selectedButton.dataset.button+"List", currentPage = Number(e.target.dataset.button));
            return;
         }

         currentPage = Number(e.target.dataset.button);
      }
      displayMovies(currentPage);
   }
}


document.addEventListener("click", throttle(closeModal, 500));
document.addEventListener("keyup", throttle(closeModal, 500));

function closeModal(e) {
   if (overlayEl[0]) {
      if (e.target.className === "overlay" || e.target.className === "modal-close") {
         overlayEl[0].children[0].classList.add("close-animation");
   
         setTimeout(() => {
            overlayEl[0].remove();
         }, 230);

         refreshLibrary();
      }
   
      if (e.key === "Escape") {
         overlayEl[0].children[0].classList.add("close-animation");
   
         setTimeout(() => {
            overlayEl[0].remove();
         }, 230);
         
         refreshLibrary();
      }
   }
}

function refreshLibrary() {
   const libBtn = document.querySelector(".nav-button.selected");
   const myLibBtn = document.querySelector(".nav-list").children[1].children[0];

   if (myLibBtn.classList.contains("active")) {
      if (libBtn) {
         displayMoviesFromLocalStorage(libBtn.getAttribute("data-button")+"List");
      }
   }
}

function setLocalStorage() {
   let watchedList = localStorage.getItem("watchedList"),
       queueList = localStorage.getItem("queueList");
   
   if (watchedList === null) {
      localStorage.setItem("watchedList", "[]");
   }

   if (queueList === null) {
      localStorage.setItem("queueList", "[]");
   }

}

setLocalStorage();

function addMovieToList(movieData, type) {
   let movieList = JSON.parse(localStorage.getItem(type)),
       isMovieOnList = false;

   movieList.forEach(movie => { if (movie.id === movieData.id) {isMovieOnList = true} });
   
   if (isMovieOnList === false) {
      movieList.push(movieData);
      if (type === "watchedList") {
         localStorage.setItem(type, JSON.stringify(movieList));
         return;
      }
      localStorage.setItem(type, JSON.stringify(movieList));
   }
}

function removeMovieFromList(movieId, type) {
   let movieList = JSON.parse(localStorage.getItem(type));

   movieList
        .filter(movie => movie.id == movieId)
        .map(movie => {
            let index = movieList.indexOf(movie)
            movieList.splice(index, 1);
            localStorage.setItem(type, JSON.stringify(movieList))
        });
}

function isMovieOnList(movieId) {
   let watchedList = JSON.parse(localStorage.getItem("watchedList"));
   let queueList = JSON.parse(localStorage.getItem("queueList"));
   let btnCont = document.getElementsByClassName("movie-buttons")[0];
   let watchedButton = btnCont.children[0];
   let queueButton = btnCont.children[1];

   if (watchedList.length != 0) {
       watchedList.forEach(movie => {
           if (movie.id === movieId) {
               watchedButton.innerText = "remove from watched";
               watchedButton.classList.add("selected");
           }
       });
   }

   if (queueList.length != 0) {
       queueList.forEach(movie => {
           if (movie.id === movieId) {
               queueButton.innerText = "remove from queue";
               queueButton.classList.add("selected");
           }
       });
   }
}