# Diamonds
A system for interactive poetry.

## To-Do
- [x] TEDx transcript database
- [ ] Server (app.js)
- [ ] User
- [ ] Controller
- [ ] Theater
- [ ] Audio

## User Interaction 1.0
- Reader speaks the poem from **controller** site.
- Audience members see the text from each section appear on their screen from **user** site.
- Audience members tap words from the text to assign weights to corresponding TED talks.
- The combination of corresponding talks create the corpus from which a new section of similar length is made. The weights increase with each word tap.
- This new section is projected in the **theater** view. 

## User Interaction 2.0
- The *new* sections get fed back to the **controller** view. 
- Correlation can be done with semantic comparison instead of word count.

## Setup
- Corpus is stored as corpus.csv in **data** folder. Must have at least a "content" column. Other columns can include data such as title, author, views, and keywords. 
- Score is stored as score.md in **data** folder.
- Each word in the score is correlated to a corpus item. This can be done by simply by looking for an item with the most occurances of the tapped word.