document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  if(document.querySelector('#content-view')){
    document.querySelector('#content-view').style.display = 'none';
  }

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('#compose-form').onsubmit = () =>{
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;
    fetch('/emails',{
      method: 'POST',
      body: JSON.stringify({
        "recipients": recipients,
        "subject": subject,
        "body": body,
      }),
      headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(result => {
      if(result.message){
        load_mailbox('sent');
        console.log("The message have been sent.");
      }
      if(result.error){
        alert("There is an error with sending the mail.");
        console.log(result.error);
      }
    })
    .catch(error =>{
      console.log(error);
      alert(error);
    });
    return false;
  };

}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display =   'none';
  if(document.querySelector('#content-view')){
    document.querySelector('#content-view').style.display = 'none';
  }

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  
  .then(emails => {
    console.log('Emails fetched:', emails)
    emails.forEach(email=>{
      
      const Divemail = document.createElement('div');
      Divemail.style.border = '1px solid black';
      Divemail.style.padding = '10px';
      Divemail.style.cursor = 'pointer';
      Divemail.className = 'email-preview';
      if(email.read){
        Divemail.style.background = 'gray';
      }
      else{
        Divemail.style.background = 'white';
      }

      Divemail.innerHTML = `
      <b>Sender: </b> ${email.sender}<br>
      <b>Subject: </b> ${email.subject}<br>
      <b>Time stamp: </b> ${email.timestamp}<br>
      `;

      Divemail.onclick = () =>{
        view_email(email.id);
        console.log('Email loaded');
      };

      document.querySelector('#emails-view').append(Divemail);
    })
  })

  .catch(error => {
    console.error('Error in load_mailbox:', error);
    alert('An error occurred while loading the mailbox.');
  });

}


function view_email(id){
  const element = document.createElement('div');
  element.id = 'content-view';

  document.body.appendChild(element);
  document.querySelector('#content-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = ('none');


  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email=>{
    const Divcontent = document.createElement('div');
    Divcontent.style.border = '1px solid blue';
    Divcontent.style.padding = '10px';
    Divcontent.className = 'content-view';
    Divcontent.style.width = '500px';

    document.querySelector('#content-view').innerHTML = '';
    
    Divcontent.innerHTML = `
      <b>Sender: </b> ${email.sender}<br>
      <b>Subject: </b> ${email.subject}<br>
      <b>Time stamp: </b> ${email.timestamp}<br>
      <b>Body: </b> <p>${email.body}</p>
    `;

    if (email.sender !== document.querySelector('h2').textContent){
      const archivebutton = document.createElement('button');
      archivebutton.innerText = email.archived ? 'Unarchive' : 'Archive';
      archivebutton.className = 'btn btn-primary';
      archivebutton.style.marginTop = '10px';

      archivebutton.onclick = () =>{
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: !email.archived,
          })
        })
        .then(() =>{
          load_mailbox('inbox');
        })

        .catch(error => {
          console.error('Error in loading the mailbox', error);
          alert(`Error in loading the mailbox: ${error}`);
        });
      }
      Divcontent.append(archivebutton);
    }

    const replyButton = document.createElement('button');
    replyButton.className = 'btn btn-primary';
    replyButton.textContent = 'Reply';
    replyButton.style.marginLeft = '20px';
    replyButton.style.marginTop = '10px';

    replyButton.onclick = () => {
      reply_email(email);
    };

    Divcontent.append(replyButton);

    document.querySelector('#content-view').append(Divcontent);
  })
  
  .catch(error=>{
    console.error('Error in load_mailbox:', error);
    alert('An error has occured while loading the email');
  });

  fetch(`/emails/${id}`,{
    method: 'PUT',
    body: JSON.stringify({
      read: true,
    })
  })
}


function reply_email(email){
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#content-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  document.querySelector('#compose-recipients').value = email.sender;
  document.querySelector('#compose-subject').value = email.subject.startsWith('Re: ')
    ? email.subject
    : `Re: ${email.subject}`;

  document.querySelector('#compose-body').value = 
    `\n\nOn ${email.timestamp}, ${email.sender} wrote:\n${email.body}`;


}