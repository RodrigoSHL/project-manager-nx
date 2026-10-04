import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Comment } from './entities/comment.entity';
import { CommentMentionNotification } from './entities/comment-mention-notification.entity';
import { CommentMentionNotificationsService } from './comment-mention-notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, CommentMentionNotification])],
  controllers: [CommentsController],
  providers: [CommentsService, CommentMentionNotificationsService],
  exports: [CommentsService],
})
export class CommentsModule {}
