# snake_game
This project visualizes the GitHub commit history of a user in a snake game format.

# To Use
Run the server using ``node server.js`` in your terminal.
   
Then go to your browser and enter http://localhost:3000/profile/{github_handle} in the search bar.

# AI
I used chatGPT to help me in the development process, as the time constraint was quite tight for me I used it quite a lot which in hindsight may have been a mistake as I ran into issues with the logic in the end that were difficult to debug in the limited time I had.  
  
# General Comments
I did not complete the task within the time constraint, the pathing logic is flawed as the snake does not dodge other commits correctly and sometimes takes strange paths, and I could not make an exact replica of the github commit history also.  
  
But I did succeed in creating something approximating the github commit history that pulls from the GitHub API and can be used to consume any users commits!  
  
The game ends as intended even if there is a small delay after consuming all the commits.

# Code Structure
I created a basic HTML page with CSS to create the visual elements and JavaScript to pull in the GitHub data and create everything all the dynamic logic on the page, except for the transitions.  
  
I used npm and Node.js the make a server that allows you to add the GitHub username of the person you wish to consume the commits of in the URL
