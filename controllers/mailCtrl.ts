import { transport } from '../class/mailer';
import { IMailOptions } from '../interface/email.interface';

class MailCtrl {
    send(mail: IMailOptions) {
        return new Promise((resolve, reject) => {
            transport.sendMail({
                from: '"🕹️ Gamezonia Online Shop 🕹️" <gamezonia.online.shop@gmail.com>', // sender address
                to: mail.to, // list of receivers
                subject: mail.subject, // Subject line
                html: mail.html, // html body
              }, (error: any, _: any) => {
                  (error) ? reject({
                      status: false,
                      message: error
                  }) : resolve({
                      status: true,
                      message: 'Email correctamente enviado a ' + mail.to,
                      mail
                  });
              });
          });
    }
}

export default MailCtrl;