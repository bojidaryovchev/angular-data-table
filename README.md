# ngdatatable

the alternative of a normal HTML table but with pagination, sorting, search, selection support and - most importantly - responsive in mobile thanks to the usage of SwiperJS! Built in Angular v9

everything one could want from a table - you have pagination, sorting, search, selection, the table headers are preserved upon scrolling so that you can always see which column you are looking at, responsive in mobile - every column is a SwiperJS slide holding a scrollable container of the rows; alongside that we make use of the angular-resize-event library which gives us the ability to listen on html element resize and determine the width based on an element instead of the window (making it a good choice to put inside a nested element because it keeps track of the occupied space and resizes itself accordingly)
